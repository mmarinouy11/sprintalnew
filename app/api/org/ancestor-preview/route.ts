import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { serviceClient } from "@/lib/supabase/service";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { getDescendants } from "@/lib/org";
import type { Organization } from "@/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

/**
 * GET /api/org/ancestor-preview?orgId=… — read-only parent/sibling view of an
 * ancestor org. Permission: the caller must be a member of at least one org in
 * that ancestor's subtree (i.e. of any descendant). Returns only names/levels/
 * slugs — no bets, sprints, or roles — since these are branches the user does
 * not belong to directly.
 */
export async function GET(req: Request) {
  const ip = getClientIp(req);
  const limit = rateLimit(`org:preview:${ip}`, { limit: 120, windowMs: 60 * 1000 });
  if (!limit.success) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const orgId = new URL(req.url).searchParams.get("orgId");
  if (!orgId) {
    return NextResponse.json({ error: "missing_org_id" }, { status: 400 });
  }

  const db = serviceClient();

  // Permission: member of any descendant of orgId.
  const descendants = await getDescendants(orgId);
  if (descendants.length === 0) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  const { data: memberRows } = await db
    .from("members")
    .select("org_id")
    .eq("user_id", session.user.id)
    .in(
      "org_id",
      descendants.map((o) => o.id),
    )
    .limit(1);

  if (!memberRows || memberRows.length === 0) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const org = descendants.find((o) => o.id === orgId)!;

  const [{ data: parentRows }, { data: siblingRows }] = await Promise.all([
    org.parent_org_id
      ? db
          .from("organizations")
          .select("id, name, slug, level")
          .eq("id", org.parent_org_id)
      : Promise.resolve({ data: [] as Organization[] }),
    org.parent_org_id
      ? db
          .from("organizations")
          .select("id, name, slug, level")
          .eq("parent_org_id", org.parent_org_id)
          .neq("id", org.id)
      : Promise.resolve({ data: [] as Organization[] }),
  ]);

  const pick = (o: Organization) => ({
    id: o.id,
    name: o.name,
    slug: o.slug,
    level: o.level,
  });

  return NextResponse.json(
    {
      org: pick(org),
      parent: parentRows?.[0] ? pick(parentRows[0] as Organization) : null,
      siblings: ((siblingRows ?? []) as Organization[]).map(pick),
    },
    { headers: { "cache-control": "no-store" } },
  );
}
