import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { serviceClient } from "@/lib/supabase/service";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { resolveLocale } from "@/lib/i18n/resolve-locale";
import { createTranslator } from "@/lib/i18n";

export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 8;

/**
 * POST /api/auth/signup — spec 4.1.
 *
 * Creates a Supabase Auth user, then atomically creates an L1 trial org + the
 * owner membership via the create_org_with_owner() SQL function (serviceClient,
 * rules #1/#2). Rate limit: 5/hour per IP.
 *
 * Privacy: the response is identical whether or not the email already exists,
 * so signup never reveals account existence.
 */
export async function POST(req: Request) {
  const locale = resolveLocale();
  const t = createTranslator(locale);
  const ip = getClientIp(req);

  const limit = rateLimit(`auth:signup:${ip}`, {
    limit: 5,
    windowMs: 60 * 60 * 1000,
  });
  if (!limit.success) {
    return NextResponse.json(
      { error: t("auth.errors.rateLimited") },
      { status: 429, headers: { "retry-after": "3600" } },
    );
  }

  let body: { email?: string; password?: string; orgName?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: t("auth.errors.generic") }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase() ?? "";
  const password = body.password ?? "";
  const orgName = body.orgName?.trim() ?? "";

  if (!email || !password || !orgName) {
    return NextResponse.json({ error: t("auth.errors.missingFields") }, { status: 400 });
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: t("auth.errors.invalidEmail") }, { status: 400 });
  }
  if (password.length < MIN_PASSWORD) {
    return NextResponse.json({ error: t("auth.errors.passwordTooShort") }, { status: 400 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  // A cookie-less anon client: signUp here must not touch this request's
  // session cookies (the new user must confirm their email before signing in).
  const anon = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  const { data, error } = await anon.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${appUrl}/auth/callback` },
  });

  if (error) {
    // Do not leak which emails are taken — respond generically for everything
    // except our own validation. (Supabase also obfuscates existing emails.)
    return NextResponse.json({ ok: true, emailConfirmationRequired: true });
  }

  // Supabase returns a user with an EMPTY identities array when the email is
  // already registered (obfuscation). Only provision an org for a genuinely
  // new user; either way the client sees the same generic success.
  const isNewUser = (data.user?.identities?.length ?? 0) > 0;
  if (data.user && isNewUser) {
    const { error: rpcError } = await serviceClient().rpc("create_org_with_owner", {
      p_user_id: data.user.id,
      p_org_name: orgName,
    });
    if (rpcError) {
      return NextResponse.json({ error: t("auth.errors.generic") }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true, emailConfirmationRequired: true });
}
