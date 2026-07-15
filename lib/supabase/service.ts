import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client. BYPASSES RLS.
 *
 * Architectural rules:
 *   #1 — service_role is used ONLY inside /app/api routes, after auth checks.
 *        The client NEVER touches this key.
 *   #2 — RLS is enabled on every table; this client is the sanctioned bypass,
 *        so every API route MUST authorize the caller before using it.
 *
 * Two guards enforce "server-only":
 *   1. The `server-only` import above makes any client-component import a
 *      build error.
 *   2. The runtime check below throws if this somehow executes in a browser.
 */
if (typeof window !== "undefined") {
  throw new Error(
    "serviceClient() was imported in the browser. The service_role key must " +
      "never reach the client (architectural rule #1).",
  );
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let cached: SupabaseClient | null = null;

export function serviceClient(): SupabaseClient {
  if (!supabaseUrl) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL.");
  }
  if (!serviceRoleKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY.");
  }

  if (cached) return cached;

  cached = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return cached;
}
