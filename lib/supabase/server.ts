import "server-only";
import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-side Supabase client bound to the request's cookies (anon key).
 *
 * Use this in Server Components, Route Handlers, and getServerSession to READ
 * the signed-in user's session and to run auth flows (sign-in / OAuth code
 * exchange) that need to WRITE refreshed session cookies.
 *
 * It is still RLS-bound (anon key) — it is NOT the service_role client. Data
 * mutations continue to go through /api routes using serviceClient() (rule #1).
 *
 * Cookie writes throw when called from a Server Component (React forbids
 * mutating cookies during render); those writes are swallowed because the
 * middleware refreshes the session cookie on every request instead.
 */
export function createSupabaseServerClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }

  const cookieStore = cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(
        cookiesToSet: { name: string; value: string; options: CookieOptions }[],
      ) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component render — safe to ignore, the
          // middleware keeps the session cookie fresh.
        }
      },
    },
  });
}
