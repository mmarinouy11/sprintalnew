/**
 * Shared TypeScript types for Sprintal.
 *
 * Skeleton set — domain models (orgs, portfolios, bets, signals) are filled in
 * as features land. These enums seed the design tokens already defined in
 * styles/globals.css so UI and data stay in lockstep.
 */

/** Plan tiers, always resolved from the root L1 org via getRootPlan() (rule #3). */
export type Plan = "trial" | "solo" | "starter" | "growth" | "scale";

/** Membership roles (spec section 5 permissions). */
export type Role = "owner" | "admin" | "editor" | "viewer";

/** A row from the organizations table (sub-org `plan` column is never trusted). */
export interface Organization {
  id: string;
  name: string;
  slug: string;
  parent_org_id: string | null;
  level: number;
  plan: string;
  brand_color: string;
  locale: string;
}

/** Supported UI locales (rule #6). Mirrors lib/i18n LOCALES. */
export type Locale = "en" | "es" | "pt";

/** Lifecycle state of a strategic bet (drives --bet-* tokens). */
export type BetState = "active" | "scaled" | "pivoted" | "done" | "killed";

/** How legible the evidence behind a bet is (drives --signal-* tokens). */
export type SignalQuality = "strong" | "unclear" | "weak";
