import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { serviceClient } from "@/lib/supabase/service";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { canCreateSubArea, createSubOrg } from "@/lib/org";
import { resolveLocale } from "@/lib/i18n/resolve-locale";
import { createTranslator, type TranslationKey } from "@/lib/i18n";
import type { Organization } from "@/types";

export const runtime = "nodejs";

/**
 * POST /api/org/create-sub — body { parentOrgId, name }.
 *
 * Owner-only (spec section 5): the caller must be an OWNER member of the parent
 * org. Enforces DEPTH_LIMITS + SUBAREAS_LIMITS via getRootPlan() +
 * count_sub_orgs (inside canCreateSubArea) before the atomic create_sub_org
 * insert. Returns { orgSlug }. Rate limit: 20/min per IP.
 */
export async function POST(req: Request) {
  const t = createTranslator(resolveLocale());
  const ip = getClientIp(req);

  const limit = rateLimit(`org:create-sub:${ip}`, { limit: 20, windowMs: 60 * 1000 });
  if (!limit.success) {
    return NextResponse.json({ error: t("org.errors.rateLimited") }, { status: 429 });
  }

  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: t("org.errors.generic") }, { status: 401 });
  }

  let body: { parentOrgId?: string; name?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: t("org.errors.generic") }, { status: 400 });
  }

  const parentOrgId = body.parentOrgId ?? "";
  const name = (body.name ?? "").trim();
  if (!parentOrgId) {
    return NextResponse.json({ error: t("org.errors.parentNotFound") }, { status: 400 });
  }
  if (!name) {
    return NextResponse.json({ error: t("org.errors.nameRequired") }, { status: 400 });
  }

  const db = serviceClient();

  const { data: parent } = await db
    .from("organizations")
    .select("id, name, slug, parent_org_id, level, plan, brand_color, locale")
    .eq("id", parentOrgId)
    .maybeSingle<Organization>();

  if (!parent) {
    return NextResponse.json({ error: t("org.errors.parentNotFound") }, { status: 404 });
  }

  // Owner-only guardrail — must be an OWNER member of the parent org.
  const { data: membership } = await db
    .from("members")
    .select("role")
    .eq("org_id", parent.id)
    .eq("user_id", session.user.id)
    .maybeSingle<{ role: string }>();

  if (!membership || membership.role !== "owner") {
    return NextResponse.json({ error: t("org.errors.notOwner") }, { status: 403 });
  }

  // Plan limits (depth + sub-area count) against the ROOT plan (rule #3).
  const check = await canCreateSubArea({ id: parent.id, level: parent.level });
  if (!check.allowed) {
    const key: TranslationKey =
      check.reason === "depth" ? "org.errors.depthLimit" : "org.errors.subAreaLimit";
    return NextResponse.json({ error: t(key), reason: check.reason }, { status: 422 });
  }

  const { slug, error } = await createSubOrg(parent.id, session.user.id, name);
  if (error || !slug) {
    const key: TranslationKey = error?.includes("name_required")
      ? "org.errors.nameRequired"
      : "org.errors.generic";
    return NextResponse.json({ error: t(key) }, { status: 400 });
  }

  return NextResponse.json({ orgSlug: slug });
}
