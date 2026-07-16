import { NextResponse } from "next/server";
import { getServerSession, roleAtLeast, isRole } from "@/lib/auth";
import { serviceClient } from "@/lib/supabase/service";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { isDurationValidForLevel, durationBandForLevel } from "@/lib/sprint";
import { resolveLocale } from "@/lib/i18n/resolve-locale";
import { createTranslator } from "@/lib/i18n";
import type { Sprint } from "@/types/sprint";

export const runtime = "nodejs";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * POST /api/sprint/create — body { slug, name, startDate, durationDays }.
 *
 * Editor+ role. Validates duration against the org level's allowed range and
 * creates the sprint via create_sprint() (status = active if the org has no
 * active sprint, else planned — the single-active rule). Rate limit 30/min.
 */
export async function POST(req: Request) {
  const t = createTranslator(resolveLocale());
  const ip = getClientIp(req);

  const limit = rateLimit(`sprint:create:${ip}`, { limit: 30, windowMs: 60 * 1000 });
  if (!limit.success) {
    return NextResponse.json({ error: t("sprint.errors.rateLimited") }, { status: 429 });
  }

  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: t("sprint.errors.generic") }, { status: 401 });
  }

  let body: { slug?: string; name?: string; startDate?: string; durationDays?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: t("sprint.errors.generic") }, { status: 400 });
  }

  const slug = body.slug ?? "";
  const name = (body.name ?? "").trim();
  const startDate = body.startDate ?? "";
  const durationDays = Number(body.durationDays);

  if (!slug || !name) {
    return NextResponse.json({ error: t("sprint.errors.nameRequired") }, { status: 400 });
  }
  if (!DATE_RE.test(startDate) || Number.isNaN(Date.parse(startDate))) {
    return NextResponse.json({ error: t("sprint.errors.invalidDate") }, { status: 400 });
  }

  const db = serviceClient();
  const { data: org } = await db
    .from("organizations")
    .select("id, level")
    .eq("slug", slug)
    .maybeSingle<{ id: string; level: number }>();

  if (!org) {
    return NextResponse.json({ error: t("sprint.errors.notFound") }, { status: 404 });
  }

  const { data: membership } = await db
    .from("members")
    .select("role")
    .eq("org_id", org.id)
    .eq("user_id", session.user.id)
    .maybeSingle<{ role: string }>();

  if (!membership || !isRole(membership.role) || !roleAtLeast(membership.role, "editor")) {
    return NextResponse.json({ error: t("sprint.errors.notAllowed") }, { status: 403 });
  }

  if (!isDurationValidForLevel(org.level, durationDays)) {
    const band = durationBandForLevel(org.level);
    return NextResponse.json(
      { error: t("sprint.errors.durationRange", { min: band.min, max: band.max }) },
      { status: 422 },
    );
  }

  const { data, error } = await db.rpc("create_sprint", {
    p_org_id: org.id,
    p_name: name,
    p_start: startDate,
    p_duration: durationDays,
  });
  const sprint = (Array.isArray(data) ? data[0] : data) as Sprint | null;

  if (error || !sprint) {
    return NextResponse.json({ error: t("sprint.errors.generic") }, { status: 500 });
  }

  return NextResponse.json({ sprintId: sprint.id, status: sprint.status });
}
