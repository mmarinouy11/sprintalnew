import "server-only";
import { serviceClient } from "../supabase/service";

/**
 * Bearer-token auth helpers for /app/api routes that receive an access token
 * explicitly (rather than via cookies). Cookie-based session reads should use
 * getServerSession instead.
 *
 * Flow (rules #1, #2): verify the token to establish identity, THEN use
 * serviceClient() (RLS bypassed) to do work.
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

/** Verify an access token and return the authenticated user, or null. */
export async function getUserFromToken(
  token: string,
): Promise<AuthedUser | null> {
  const { data, error } = await serviceClient().auth.getUser(token);
  if (error || !data.user) return null;
  return { id: data.user.id, email: data.user.email ?? null };
}

/** Resolve the authed user directly from a request's Bearer token, or null. */
export async function requireUser(req: Request): Promise<AuthedUser | null> {
  const token = getBearerToken(req);
  if (!token) return null;
  return getUserFromToken(token);
}
