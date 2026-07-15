/**
 * AI layer public surface (server-only consumers).
 * Coaches read model IDs from env (rule #4) and require ANTHROPIC_API_KEY.
 */
export { anthropic } from "./client";
export { AiModels } from "./models";
export { formulationCoach, semanticCoach } from "./coaches";
export * from "./prompts";
