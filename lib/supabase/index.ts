/**
 * Supabase clients.
 *
 * - browserClient(): anon key, RLS-bound, safe on the client (auth/session).
 * - serviceClient(): service_role, server-only, RLS-bypassing — import it
 *   directly from "@/lib/supabase/service" inside /app/api routes so the
 *   `server-only` guard is preserved and it never leaks into client bundles.
 */
export { browserClient } from "./browser";
