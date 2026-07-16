import "server-only";
import { serviceClient } from "../supabase/service";
import type { Organization } from "@/types";

/**
 * Thin server-only wrappers over the org SQL functions (rules #1/#2). All are
 * invoked with serviceClient() after the route has authorized the caller.
 */

/** Normalize a Supabase composite/setof result into rows. */
function asRows<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data) return [data as T];
  return [];
}

/** Walk parent_org_id to the L1 root and return that org row (rule #3). */
export async function getRootOrg(orgId: string): Promise<Organization | null> {
  const { data, error } = await serviceClient().rpc("get_root_org", {
    org_id: orgId,
  });
  if (error) throw new Error(`getRootOrg: ${error.message}`);
  return asRows<Organization>(data)[0] ?? null;
}

/** Count ALL descendants of a root org. */
export async function countSubOrgs(rootId: string): Promise<number> {
  const { data, error } = await serviceClient().rpc("count_sub_orgs", {
    root_id: rootId,
  });
  if (error) throw new Error(`countSubOrgs: ${error.message}`);
  return typeof data === "number" ? data : Number(data ?? 0);
}

/** All descendants of a root, including the root itself. */
export async function getDescendants(rootId: string): Promise<Organization[]> {
  const { data, error } = await serviceClient().rpc("get_org_descendants", {
    root_id: rootId,
  });
  if (error) throw new Error(`getDescendants: ${error.message}`);
  return asRows<Organization>(data);
}

/** Ancestors of an org (parent … root), excluding the org itself. */
export async function getAncestors(orgId: string): Promise<Organization[]> {
  const { data, error } = await serviceClient().rpc("get_org_ancestors", {
    p_org_id: orgId,
  });
  if (error) throw new Error(`getAncestors: ${error.message}`);
  // Sort root-first (lowest level first).
  return asRows<Organization>(data).sort((a, b) => a.level - b.level);
}

/** Atomically create a sub-org + owner membership. Returns the new slug. */
export async function createSubOrg(
  parentId: string,
  userId: string,
  name: string,
): Promise<{ slug?: string; error?: string }> {
  const { data, error } = await serviceClient().rpc("create_sub_org", {
    p_parent_id: parentId,
    p_user_id: userId,
    p_name: name,
  });
  if (error) return { error: error.message };
  return { slug: data as string };
}
