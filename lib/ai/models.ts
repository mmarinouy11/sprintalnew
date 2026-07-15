import "server-only";

/**
 * AI model IDs (architectural rule #4): ALWAYS read from env vars, NEVER
 * hard-coded. This is the single place env model config is resolved.
 *
 *   AI_MODEL_FORMULATION — syntactic coach (fast, e.g. Haiku)
 *   AI_MODEL_SEMANTIC    — semantic coach (deep + web_search, e.g. Sonnet 4.5)
 *   AI_MODEL_FALLBACK    — degraded fallback when a primary model is unavailable
 */
function requireModel(envVar: string): string {
  const value = process.env[envVar];
  if (!value) {
    throw new Error(
      `Missing ${envVar}. AI model IDs must come from env vars (rule #4).`,
    );
  }
  return value;
}

export const AiModels = {
  /** Syntactic / formulation coach — checks how a bet is written. */
  get formulation(): string {
    return requireModel("AI_MODEL_FORMULATION");
  },
  /** Semantic coach — reasons about substance; may use web_search. */
  get semantic(): string {
    return requireModel("AI_MODEL_SEMANTIC");
  },
  /** Fallback model for graceful degradation. */
  get fallback(): string {
    return requireModel("AI_MODEL_FALLBACK");
  },
} as const;
