import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { serviceClient } from "@/lib/supabase/service";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import {
  getRootOrg,
  getAncestors,
  countSubOrgs,
} from "@/lib/org";
import {
  DEPTH_LIMITS,
  SUBAREAS_LIMITS,
  ACTIVE_BETS_LIMITS,
  normalizePlan,
} from "@/lib/plan-limits";
import type { Organization, Role } from "@/types";
import type { OrgData, OrgSummary } from "@/types/org";

// The single org-data endpoint must always reflect live state.
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

/**
 * GET /api/org/data?slug=… — the ONE endpoint that loads everything the app
 * needs for an org: the org, its ancestors/siblings/children (with the caller's
 * role in each), current sprints, active bets, and effective plan limits.
 *
 * Auth: the caller must be a member of the requested org. All reads use
 * serviceClient() after that check (rules #1/#2). Rate limit: 300/min per IP.
 */
export async function GET(req: Request) {
  const ip = getClientIp(req);
  const limit = rateLimit(`org:data:${ip}`, { limit: 300, windowMs: 60 * 1000 });
  if (!limit.success) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const slug = new URL(req.url).searchParams.get("slug");
  if (!slug) {
    return NextResponse.json({ error: "missing_slug" }, { status: 400 });
  }

  const db = serviceClient();

  const { data: org } = await db
    .from("organizations")
    .select("id, name, slug, parent_org_id, level, plan, brand_color, locale")
    .eq("slug", slug)
    .maybeSingle<Organization>();

  if (!org) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  // Authorize: caller must be a member of THIS org.
  const { data: membership } = await db
    .from("members")
    .select("role")
    .eq("org_id", org.id)
    .eq("user_id", session.user.id)
    .maybeSingle<{ role: Role }>();

  if (!membership) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const [root, ancestors, siblingsRes, childrenRes] = await Promise.all([
    getRootOrg(org.id),
    getAncestors(org.id),
    org.parent_org_id
      ? db
          .from("organizations")
          .select("id, name, slug, level")
          .eq("parent_org_id", org.parent_org_id)
          .neq("id", org.id)
      : Promise.resolve({ data: [] as Organization[] }),
    db
      .from("organizations")
      .select("id, name, slug, level")
      .eq("parent_org_id", org.id),
  ]);

  const siblings = (siblingsRes.data ?? []) as Organization[];
  const children = (childrenRes.data ?? []) as Organization[];
  const rootPlan = normalizePlan(root?.plan);

  // Resolve the caller's membership across every related org in one query.
  const relatedIds = [
    ...ancestors.map((o) => o.id),
    ...siblings.map((o) => o.id),
    ...children.map((o) => o.id),
  ];
  const roleByOrg = new Map<string, Role>();
  if (relatedIds.length > 0) {
    const { data: memberRows } = await db
      .from("members")
      .select("org_id, role")
      .eq("user_id", session.user.id)
      .in("org_id", relatedIds);
    for (const m of (memberRows ?? []) as { org_id: string; role: Role }[]) {
      roleByOrg.set(m.org_id, m.role);
    }
  }

  const toSummary = (o: {
    id: string;
    name: string;
    slug: string;
    level: number;
  }): OrgSummary => ({
    id: o.id,
    name: o.name,
    slug: o.slug,
    level: o.level,
    isMember: roleByOrg.has(o.id),
    role: roleByOrg.get(o.id) ?? null,
  });

  const [{ data: sprints }, { data: activeBets }, currentSubAreas] =
    await Promise.all([
      db
        .from("sprints")
        .select("id, name, status, start_date, end_date")
        .eq("org_id", org.id)
        .eq("status", "active")
        .order("start_date", { ascending: false }),
      db
        .from("bets")
        .select("id, title, status, signal, bet_type")
        .eq("org_id", org.id)
        .eq("status", "active")
        .order("created_at", { ascending: false }),
      root ? countSubOrgs(root.id) : Promise.resolve(0),
    ]);

  const depthLimit = DEPTH_LIMITS[rootPlan];
  const subAreaLimit = SUBAREAS_LIMITS[rootPlan];
  const activeBetsLimit = ACTIVE_BETS_LIMITS[rootPlan];
  const canCreateSubArea =
    membership.role === "owner" &&
    org.level + 1 <= depthLimit &&
    (subAreaLimit === null || currentSubAreas < subAreaLimit);

  const payload: OrgData = {
    org: {
      id: org.id,
      name: org.name,
      slug: org.slug,
      level: org.level,
      brand_color: org.brand_color,
      locale: org.locale,
    },
    role: membership.role,
    rootPlan,
    ancestors: ancestors.map(toSummary),
    siblings: siblings.map(toSummary),
    children: children.map(toSummary),
    sprints: (sprints ?? []) as OrgData["sprints"],
    activeBets: (activeBets ?? []) as OrgData["activeBets"],
    limits: {
      depthLimit,
      subAreaLimit,
      activeBetsLimit,
      currentSubAreas,
      canCreateSubArea,
    },
  };

  return NextResponse.json(payload, {
    headers: { "cache-control": "no-store" },
  });
}
