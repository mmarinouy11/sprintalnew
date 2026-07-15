import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Browser Supabase client using the public ANON key.
 *
 * This client is safe to use in client components. It is subject to RLS
 * (rule #2) — it can only ever see what the signed-in user is allowed to see.
 * It must NEVER be given the service_role key (rule #1).
 *
 * Note: per the architecture, most data loading goes through /api routes
 * (rule #1). This client is primarily for Supabase Auth (session/sign-in).
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

  // Reuse a single instance in the browser to keep one auth/realtime session.
  if (cached) return cached;

  cached = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

  return cached;
}
