import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * GET /auth/callback — OAuth / email-link callback. Exchanges the `code` for a
 * session (writing session cookies), then hands off to /auth/callback/complete
 * to resolve the user's home org.
 *
 * Plan intent from /pricing is threaded through via `?plan=` and preserved on
 * the redirect so onboarding can honor it. `?next=` (a same-origin path) is
 * also preserved for post-login return.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const plan = url.searchParams.get("plan");
  const next = url.searchParams.get("next");

  const complete = new URL("/auth/callback/complete", url.origin);
  if (plan) complete.searchParams.set("plan", plan);
  if (next && next.startsWith("/") && !next.startsWith("//")) {
    complete.searchParams.set("next", next);
  }

  if (!code) {
    return NextResponse.redirect(new URL("/auth/login", url.origin));
  }

  const { error } = await createSupabaseServerClient().auth.exchangeCodeForSession(
    code,
  );
  if (error) {
    const login = new URL("/auth/login", url.origin);
    login.searchParams.set("error", "auth");
    return NextResponse.redirect(login);
  }

  return NextResponse.redirect(complete);
}
