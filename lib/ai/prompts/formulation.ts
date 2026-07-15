/**
 * Prompt template for the syntactic / formulation coach.
 *
 * Skeleton only — the coach checks whether a bet is *written* well (clear
 * hypothesis, measurable signal, timeframe) without judging its substance.
 * Real prompt copy lands with the coach feature; keep model choice in env
 * (rule #4) and all user-facing strings translated where surfaced (rule #6).
 */
export const FORMULATION_SYSTEM_PROMPT = `You are Sprintal's formulation coach.
You review how clearly a strategic bet is written — not whether it is a good
idea. Keep feedback short, concrete, and structural.`.trim();

export function buildFormulationPrompt(betText: string): string {
  return `Review the wording of this bet:\n\n${betText}`;
}
