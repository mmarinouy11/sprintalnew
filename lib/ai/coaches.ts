import "server-only";
import { anthropic } from "./client";
import { AiModels } from "./models";
import {
  FORMULATION_SYSTEM_PROMPT,
  SEMANTIC_SYSTEM_PROMPT,
  buildFormulationPrompt,
  buildSemanticPrompt,
} from "./prompts";

/**
 * AI coach clients (skeleton).
 *
 * - formulationCoach: fast syntactic review, model = AI_MODEL_FORMULATION.
 * - semanticCoach: deep substance review with web_search, model = AI_MODEL_SEMANTIC.
 *
 * Both read their model from env via AiModels (rule #4). No orchestration or
 * business logic yet — these establish the call shape the API routes will use.
 */

const MAX_TOKENS = 1024;

export async function formulationCoach(betText: string) {
  return anthropic().messages.create({
    model: AiModels.formulation,
    max_tokens: MAX_TOKENS,
    system: FORMULATION_SYSTEM_PROMPT,
    messages: [{ role: "user", content: buildFormulationPrompt(betText) }],
  });
}

export async function semanticCoach(betText: string, context?: string) {
  return anthropic().messages.create({
    model: AiModels.semantic,
    max_tokens: MAX_TOKENS,
    system: SEMANTIC_SYSTEM_PROMPT,
    messages: [
      { role: "user", content: buildSemanticPrompt(betText, context) },
    ],
    // web_search tool is wired in when the semantic coach feature lands.
  });
}
