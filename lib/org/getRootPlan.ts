import "server-only";
import type { Plan } from "@/types";
import { normalizePlan } from "../plan-limits";
import { getRootOrg } from "./rpc";

/**
 * Resolve the effective plan for any org by walking to its L1 root and reading
 * the root's plan (rule #3). A sub-org's own `plan` column is never trusted.
 * Falls back to "trial" if the root row or its plan is missing/unknown.
 */
export async function getRootPlan(orgId: string): Promise<Plan> {
  const root = await getRootOrg(orgId);
  return normalizePlan(root?.plan);
}
