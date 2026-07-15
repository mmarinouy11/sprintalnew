/**
 * Prompt template for the semantic coach.
 *
 * Skeleton only — the semantic coach reasons about the *substance* of a bet
 * (is the assumption plausible, what evidence exists) and may use web_search.
 * Real prompt copy lands with the coach feature.
 */
export const SEMANTIC_SYSTEM_PROMPT = `You are Sprintal's semantic coach.
You evaluate the substance of a strategic bet: the strength of its assumptions
and the evidence for or against them. You may search the web for supporting or
contradicting evidence. Be rigorous and cite what you find.`.trim();

export function buildSemanticPrompt(betText: string, context?: string): string {
  const base = `Evaluate the reasoning behind this bet:\n\n${betText}`;
  return context ? `${base}\n\nAdditional context:\n${context}` : base;
}
