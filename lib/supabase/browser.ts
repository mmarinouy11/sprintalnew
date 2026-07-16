import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Browser Supabase client using the public ANON key.
 *
 * Uses @supabase/ssr's createBrowserClient so the auth session is stored in
 * COOKIES (not localStorage). That is what lets the server read the session
 * (getServerSession) and lets middleware gate /[orgSlug]/* routes.
 *
 * Safe on the client, subject to RLS (rule #2), never given service_role
 * (rule #1). Most data loading still goes through /api routes (rule #1); this
 * client is primarily for Supabase Auth (sign-in, OAuth, password updates).
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let cached: SupabaseClient | null = null;

export function browserClient(): SupabaseClient {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }
  if (cached) return cached;
  cached = createBrowserClient(supabaseUrl, supabaseAnonKey);
  return cached;
}
