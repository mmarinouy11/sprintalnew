import "server-only";
import { serviceClient } from "./supabase/service";

/**
 * Server-side auth helpers used by /app/api routes.
 *
 * The flow (rule #1 + #2): a route receives the caller's Supabase access token
 * (Bearer header / cookie), verifies it here to establish identity, and ONLY
 * then uses serviceClient() to read/write with RLS bypassed.
 *
 * This is the skeleton seam — org/plan resolution (getRootPlan walk, rule #3)
 * lands here later. No business logic yet.
 */

export interface AuthedUser {
  id: string;
  email: string | null;
}

/** Extract a Bearer token from an incoming request, if present. */
export function getBearerToken(req: Request): string | null {
  const header = req.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  return header.slice("Bearer ".length).trim() || null;
}

/**
 * Verify an access token and return the authenticated user, or null if invalid.
 * Uses the service client purely to validate the JWT against Supabase Auth.
 */
export async function getUserFromToken(
  token: string,
): Promise<AuthedUser | null> {
  const { data, error } = await serviceClient().auth.getUser(token);
  if (error || !data.user) return null;
  return { id: data.user.id, email: data.user.email ?? null };
}

/**
 * Convenience: resolve the authed user directly from a request, or null.
 * Routes should return 401 when this yields null before doing any work.
 */
export async function requireUser(req: Request): Promise<AuthedUser | null> {
  const token = getBearerToken(req);
  if (!token) return null;
  return getUserFromToken(token);
}
