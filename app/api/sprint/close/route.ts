import { NextResponse } from "next/server";
import { getServerSession, roleAtLeast, isRole } from "@/lib/auth";
import { serviceClient } from "@/lib/supabase/service";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { getRootPlan } from "@/lib/org";
import { resolveLocale } from "@/lib/i18n/resolve-locale";
import { createTranslator } from "@/lib/i18n";
import type { Sprint } from "@/types/sprint";

export const runtime = "nodejs";

/**
 * POST /api/sprint/close — body { sprintId }.
 *
 * Owner/Admin only, and plan-gated: closing is NOT available on the trial plan
 * (spec section 6). Plan is resolved from the root L1 org (rule #3). One-way to
 * 'closed'. Rate limit 30/min.
 */
export async function POST(req: Request) {
  const t = createTranslator(resolveLocale());
  const ip = getClientIp(req);

  const limit = rateLimit(`sprint:close:${ip}`, { limit: 30, windowMs: 60 * 1000 });
  if (!limit.success) {
    return NextResponse.json({ error: t("sprint.errors.rateLimited") }, { status: 429 });
  }

  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: t("sprint.errors.generic") }, { status: 401 });
  }

  let body: { sprintId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: t("sprint.errors.generic") }, { status: 400 });
  }
  const sprintId = body.sprintId ?? "";
  if (!sprintId) {
    return NextResponse.json({ error: t("sprint.errors.notFound") }, { status: 400 });
  }

  const db = serviceClient();
  const { data: sprint } = await db
    .from("sprints")
    .select("id, org_id")
    .eq("id", sprintId)
    .maybeSingle<{ id: string; org_id: string }>();

  if (!sprint) {
    return NextResponse.json({ error: t("sprint.errors.notFound") }, { status: 404 });
  }

  const { data: membership } = await db
    .from("members")
    .select("role")
    .eq("org_id", sprint.org_id)
    .eq("user_id", session.user.id)
    .maybeSingle<{ role: string }>();

  if (!membership || !isRole(membership.role) || !roleAtLeast(membership.role, "admin")) {
    return NextResponse.json({ error: t("sprint.errors.notAllowed") }, { status: 403 });
  }

  // Plan gate (rule #3): closing is disabled on trial.
  const plan = await getRootPlan(sprint.org_id);
  if (plan === "trial") {
    return NextResponse.json({ error: t("sprint.errors.closeNotOnTrial") }, { status: 403 });
  }

  const { data, error } = await db.rpc("close_sprint", { p_sprint_id: sprintId });
  const updated = (Array.isArray(data) ? data[0] : data) as Sprint | null;

  if (error) {
    const status = error.message.toLowerCase().includes("already_closed") ? 409 : 422;
    return NextResponse.json({ error: t("sprint.errors.generic") }, { status });
  }

  return NextResponse.json({ ok: true, status: updated?.status ?? "closed" });
}
