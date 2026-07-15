import "server-only";

/**
 * Per-IP route-level rate limiting (architectural rule #5).
 *
 * This is a fixed-window in-memory limiter — sufficient for a single-instance
 * dev/preview deployment and as the enforcement seam every API route calls.
 *
 * SHORTCUT (called out per rule #8): in-memory state does NOT survive across
 * serverless instances or cold starts, so on multi-instance production hosting
 * this under-counts. Swap the `store` for a shared backend (Upstash Redis /
 * Supabase table) before relying on it for real abuse protection. The public
 * `rateLimit()` signature is designed so that swap is a one-file change.
 */

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  /** Unix ms timestamp when the current window resets. */
  reset: number;
}

interface RateLimitOptions {
  /** Max requests allowed per window. */
  limit: number;
  /** Window length in milliseconds. */
  windowMs: number;
}

interface WindowState {
  count: number;
  reset: number;
}

const store = new Map<string, WindowState>();

/**
 * Enforce a fixed-window limit for `key` (typically "<routeId>:<ip>").
 * Returns whether the request is allowed plus headers-friendly metadata.
 */
export function rateLimit(key: string, opts: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  const existing = store.get(key);

  if (!existing || existing.reset <= now) {
    const state: WindowState = { count: 1, reset: now + opts.windowMs };
    store.set(key, state);
    return {
      success: true,
      limit: opts.limit,
      remaining: opts.limit - 1,
      reset: state.reset,
    };
  }

  existing.count += 1;
  const remaining = Math.max(0, opts.limit - existing.count);
  return {
    success: existing.count <= opts.limit,
    limit: opts.limit,
    remaining,
    reset: existing.reset,
  };
}

/**
 * Best-effort client IP extraction from a request's forwarding headers.
 * Vercel/most proxies set `x-forwarded-for`; the first entry is the client.
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

/** Occasionally drop expired windows so the map doesn't grow unbounded. */
export function pruneExpired(now = Date.now()): void {
  for (const [key, state] of store) {
    if (state.reset <= now) store.delete(key);
  }
}
