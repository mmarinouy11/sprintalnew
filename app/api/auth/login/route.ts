import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { resolveLocale } from "@/lib/i18n/resolve-locale";
import { createTranslator, type TranslationKey } from "@/lib/i18n";

export const runtime = "nodejs";

/**
 * POST /api/auth/login — spec 4.1.
 *
 * Proxies to Supabase signInWithPassword using the cookie-bound server client,
 * so a successful sign-in writes the session cookies onto the response. Supabase
 * error codes are translated into locale-specific messages. Rate limit: 10/min
 * per IP.
 *
 * Privacy: bad email and bad password both map to the same "invalid
 * credentials" message, so login never reveals account existence.
 */
export async function POST(req: Request) {
  const locale = resolveLocale();
  const t = createTranslator(locale);
  const ip = getClientIp(req);

  const limit = rateLimit(`auth:login:${ip}`, { limit: 10, windowMs: 60 * 1000 });
  if (!limit.success) {
    return NextResponse.json(
      { error: t("auth.errors.rateLimited") },
      { status: 429, headers: { "retry-after": "60" } },
    );
  }

  let body: { email?: string; password?: string; next?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: t("auth.errors.generic") }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase() ?? "";
  const password = body.password ?? "";
  if (!email || !password) {
    return NextResponse.json({ error: t("auth.errors.missingFields") }, { status: 400 });
  }

  const supabase = createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return NextResponse.json(
      { error: t(mapAuthError(error.code, error.message)) },
      { status: 401 },
    );
  }

  // Only allow same-origin relative redirects to prevent open-redirect abuse.
  const next =
    body.next && body.next.startsWith("/") && !body.next.startsWith("//")
      ? body.next
      : "/auth/callback/complete";

  return NextResponse.json({ ok: true, redirect: next });
}

/** Map Supabase auth error codes/messages to translation keys. */
function mapAuthError(code: string | undefined, message: string): TranslationKey {
  const c = code ?? "";
  const m = message.toLowerCase();
  if (c === "email_not_confirmed" || m.includes("not confirmed")) {
    return "auth.errors.emailNotConfirmed";
  }
  if (c === "over_request_rate_limit" || m.includes("rate limit")) {
    return "auth.errors.rateLimited";
  }
  // Default: never distinguish "no such user" from "wrong password".
  return "auth.errors.invalidCredentials";
}
