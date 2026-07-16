import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { serviceClient } from "@/lib/supabase/service";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { resolveLocale } from "@/lib/i18n/resolve-locale";
import { createTranslator, type TranslationKey } from "@/lib/i18n";

export const runtime = "nodejs";

/**
 * POST /api/auth/accept-invite — attach the signed-in user to an org from an
 * invite token. Requires an authenticated session; the accept_invite() SQL
 * function validates the token and inserts the membership atomically (rules
 * #1/#2). Rate limit: 20/min per IP.
 */
export async function POST(req: Request) {
  const locale = resolveLocale();
  const t = createTranslator(locale);
  const ip = getClientIp(req);

  const limit = rateLimit(`auth:accept:${ip}`, { limit: 20, windowMs: 60 * 1000 });
  if (!limit.success) {
    return NextResponse.json({ error: t("auth.errors.rateLimited") }, { status: 429 });
  }

  let body: { token?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: t("auth.errors.generic") }, { status: 400 });
  }
  const token = body.token ?? "";
  if (!token) {
    return NextResponse.json({ error: t("auth.errors.inviteInvalid") }, { status: 400 });
  }

  const {
    data: { user },
  } = await createSupabaseServerClient().auth.getUser();
  if (!user) {
    return NextResponse.json({ error: t("auth.errors.generic") }, { status: 401 });
  }

  const { data, error } = await serviceClient().rpc("accept_invite", {
    p_token: token,
    p_user_id: user.id,
    p_user_email: user.email ?? "",
  });

  if (error) {
    return NextResponse.json(
      { error: t(mapInviteError(error.message)) },
      { status: 400 },
    );
  }

  return NextResponse.json({ ok: true, slug: data as string });
}

/** Map accept_invite() raised keywords to translation keys. */
function mapInviteError(message: string): TranslationKey {
  const m = message.toLowerCase();
  if (m.includes("invite_expired")) return "auth.errors.inviteExpired";
  if (m.includes("invite_email_mismatch")) return "auth.errors.inviteEmailMismatch";
  if (m.includes("invite_invalid")) return "auth.errors.inviteInvalid";
  return "auth.errors.generic";
}
