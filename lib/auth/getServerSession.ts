import "server-only";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "../supabase/server";
import { serviceClient } from "../supabase/service";

/** Cookie remembering which org the user last viewed (for multi-org users). */
export const CURRENT_ORG_COOKIE = "sprintal_current_org";

/** An org the user belongs to, with their role in it. */
export interface OrgMembership {
  id: string;
  name: string;
  slug: string;
  level: number;
  plan: string;
  role: "owner" | "admin" | "editor" | "viewer";
}

export interface ServerSession {
  user: { id: string; email: string | null };
  orgs: OrgMembership[];
  /** The active org: matched by slug, else the current-org cookie, else the first. */
  currentOrg: OrgMembership | null;
}

/**
 * Read the Supabase session on the server and resolve the user's orgs.
 *
 * Identity comes from the cookie-bound server client (anon key, verified
 * against Supabase Auth). Org membership is then loaded with serviceClient()
 * (RLS bypassed) — a legitimate post-auth read per rules #1/#2.
 *
 * @param opts.orgSlug when the caller knows the target org (e.g. the URL
 *        segment), prefer it for currentOrg so deep links resolve correctly.
 * @returns the session, or null when there is no signed-in user.
 */
export async function getServerSession(opts?: {
  orgSlug?: string;
}): Promise<ServerSession | null> {
  const {
    data: { user },
  } = await createSupabaseServerClient().auth.getUser();

  if (!user) return null;

  const { data, error } = await serviceClient()
    .from("members")
    .select("role, organizations!inner(id, name, slug, level, plan)")
    .eq("user_id", user.id);

  if (error) {
    throw new Error(`getServerSession: failed to load orgs — ${error.message}`);
  }

  const orgs: OrgMembership[] = (data ?? []).map((row) => {
    // supabase-js types the embedded relation as an array; it's 1:1 here.
    const org = (
      Array.isArray(row.organizations)
        ? row.organizations[0]
        : row.organizations
    ) as {
      id: string;
      name: string;
      slug: string;
      level: number;
      plan: string;
    };
    return {
      id: org.id,
      name: org.name,
      slug: org.slug,
      level: org.level,
      plan: org.plan,
      role: row.role as OrgMembership["role"],
    };
  });

  const cookieSlug = cookies().get(CURRENT_ORG_COOKIE)?.value;
  const currentOrg =
    (opts?.orgSlug && orgs.find((o) => o.slug === opts.orgSlug)) ||
    (cookieSlug && orgs.find((o) => o.slug === cookieSlug)) ||
    orgs[0] ||
    null;

  return {
    user: { id: user.id, email: user.email ?? null },
    orgs,
    currentOrg,
  };
}
