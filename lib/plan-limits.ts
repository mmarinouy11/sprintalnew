import type { Plan } from "@/types";

/**
 * Plan limits for the hierarchical org model (spec sections 2 and 2.5).
 *
 * The plan is ALWAYS the root L1 org's plan (rule #3) — resolve it with
 * getRootPlan() before consulting these tables. A sub-org's own `plan` column
 * is meaningless and must never be read.
 *
 *   null = unlimited.
 */

/** Maximum org depth (level) allowed. trial/solo/starter = 2 levels, up to 4 on scale. */
export const DEPTH_LIMITS: Record<Plan, number> = {
  trial: 2,
  solo: 2,
  starter: 2,
  growth: 3,
  scale: 4,
};

/** Maximum number of sub-areas (total descendants of the root). */
export const SUBAREAS_LIMITS: Record<Plan, number | null> = {
  trial: 4,
  solo: 4,
  starter: null,
  growth: null,
  scale: null,
};

/** Maximum number of concurrently ACTIVE bets. */
export const ACTIVE_BETS_LIMITS: Record<Plan, number | null> = {
  trial: 5,
  solo: null,
  starter: null,
  growth: null,
  scale: null,
};

/** The plan every org starts on. */
export const DEFAULT_PLAN: Plan = "trial";

const PLANS: readonly Plan[] = ["trial", "solo", "starter", "growth", "scale"];

export function isPlan(value: unknown): value is Plan {
  return typeof value === "string" && (PLANS as readonly string[]).includes(value);
}

/** Coerce an untrusted string into a known Plan, defaulting to `trial`. */
export function normalizePlan(value: unknown): Plan {
  return isPlan(value) ? value : DEFAULT_PLAN;
}
