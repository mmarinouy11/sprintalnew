import "server-only";
import Anthropic from "@anthropic-ai/sdk";

/**
 * Anthropic API client factory (server-only — the API key must never reach
 * the browser). Coaches call this rather than constructing their own client
 * so key handling and defaults live in one place.
 */
let cached: Anthropic | null = null;

export function anthropic(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("Missing ANTHROPIC_API_KEY.");
  }
  if (cached) return cached;
  cached = new Anthropic({ apiKey });
  return cached;
}
