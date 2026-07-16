import "server-only";
import type { Plan } from "@/types";
import { DEPTH_LIMITS, SUBAREAS_LIMITS, normalizePlan } from "../plan-limits";
import { getRootOrg, countSubOrgs } from "./rpc";

export interface SubAreaCheck {
  allowed: boolean;
  /** Why creation is blocked, when not allowed. */
  reason?: "depth" | "subareas";
  rootPlan: Plan;
  /** Deepest level this plan permits. */
  depthLimit: number;
  /** Max total sub-areas for this plan (null = unlimited). */
  subAreaLimit: number | null;
  /** Current total number of descendants under the root. */
  currentSubAreas: number;
}

/**
 * Can a new sub-area be created under `parentOrg`? Enforces the two limits from
 * spec 2.5 against the ROOT plan (rule #3):
 *   - depth:     parent.level + 1 must not exceed DEPTH_LIMITS[plan]
 *   - sub-areas: count_sub_orgs(root) must be below SUBAREAS_LIMITS[plan]
 */
export async function canCreateSubArea(parentOrg: {
  id: string;
  level: number;
}): Promise<SubAreaCheck> {
  const root = await getRootOrg(parentOrg.id);
  const rootPlan = normalizePlan(root?.plan);
  const depthLimit = DEPTH_LIMITS[rootPlan];
  const subAreaLimit = SUBAREAS_LIMITS[rootPlan];

  const currentSubAreas = root ? await countSubOrgs(root.id) : 0;

  const base = { rootPlan, depthLimit, subAreaLimit, currentSubAreas };

  if (parentOrg.level + 1 > depthLimit) {
    return { allowed: false, reason: "depth", ...base };
  }
  if (subAreaLimit !== null && currentSubAreas >= subAreaLimit) {
    return { allowed: false, reason: "subareas", ...base };
  }
  return { allowed: true, ...base };
}
