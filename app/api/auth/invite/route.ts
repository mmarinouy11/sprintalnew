import { NextResponse } from "next/server";
import { serviceClient } from "@/lib/supabase/service";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

/**
 * GET /api/auth/invite?token=… — validate an invite token and return the
 * minimal info the accept-invite page needs to render (org name, invited email,
 * role). Public (the token is the credential). Uses serviceClient() because the
 * invites table is RLS-locked to members. Rate limit: 30/min per IP.
 */
export async function GET(req: Request) {
  const ip = getClientIp(req);
  const limit = rateLimit(`auth:invite:${ip}`, { limit: 30, windowMs: 60 * 1000 });
  if (!limit.success) {
    return NextResponse.json({ valid: false, reason: "rate_limited" }, { status: 429 });
  }

  const token = new URL(req.url).searchParams.get("token") ?? "";
  if (!token) {
    return NextResponse.json({ valid: false, reason: "invalid" }, { status: 400 });
  }

  const { data, error } = await serviceClient()
    .from("invites")
    .select("email, role, expires_at, accepted_at, organizations!inner(name, slug)")
    .eq("token", token)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ valid: false, reason: "invalid" });
  }
  if (data.accepted_at) {
    return NextResponse.json({ valid: false, reason: "invalid" });
  }
  if (new Date(data.expires_at).getTime() < Date.now()) {
    return NextResponse.json({ valid: false, reason: "expired" });
  }

  const org = Array.isArray(data.organizations)
    ? data.organizations[0]
    : data.organizations;

  return NextResponse.json({
    valid: true,
    email: data.email,
    role: data.role,
    orgName: (org as { name: string }).name,
  });
}
