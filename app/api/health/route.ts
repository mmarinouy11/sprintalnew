import { NextResponse } from "next/server";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

/**
 * Health check — also the reference shape for API routes: rate-limit per IP
 * (rule #5) at the top, then do work. Real routes additionally authorize the
 * caller (lib/auth) before using serviceClient() (rules #1, #2).
 */
export const runtime = "nodejs";

export async function GET(req: Request) {
  const ip = getClientIp(req);
  const limit = rateLimit(`health:${ip}`, { limit: 60, windowMs: 60_000 });
  if (!limit.success) {
    return NextResponse.json(
      { error: "rate_limited" },
      { status: 429, headers: { "retry-after": "60" } },
    );
  }

  return NextResponse.json({ status: "ok", service: "sprintal" });
}
