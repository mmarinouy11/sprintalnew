import { NextResponse } from "next/server";
import { getServerSession, roleAtLeast, isRole } from "@/lib/auth";
import { serviceClient } from "@/lib/supabase/service";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { resolveLocale } from "@/lib/i18n/resolve-locale";
import { createTranslator, type TranslationKey } from "@/lib/i18n";
import type { Sprint } from "@/types/sprint";

export const runtime = "nodejs";

/**
 * POST /api/sprint/activate — body { sprintId }.
 *
 * Owner/Admin only. Moves a planned sprint to active, blocking if another
 * active sprint already exists in the org (single-active rule, enforced in
 * activate_sprint() + the partial unique index). Rate limit 30/min.
 */
export async function POST(req: Request) {
  const t = createTranslator(resolveLocale());
  const ip = getClientIp(req);

  const limit = rateLimit(`sprint:activate:${ip}`, { limit: 30, windowMs: 60 * 1000 });
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

  const { data, error } = await db.rpc("activate_sprint", { p_sprint_id: sprintId });
  const updated = (Array.isArray(data) ? data[0] : data) as Sprint | null;

  if (error) {
    const m = error.message.toLowerCase();
    if (m.includes("active_sprint_exists")) {
      return NextResponse.json({ error: t("sprint.errors.activeExists") }, { status: 409 });
    }
    const key: TranslationKey = m.includes("invalid_transition")
      ? "sprint.errors.invalidTransition"
      : "sprint.errors.generic";
    return NextResponse.json({ error: t(key) }, { status: 422 });
  }

  return NextResponse.json({ ok: true, status: updated?.status ?? "active" });
}
