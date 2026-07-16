import type { Plan, Role } from "./index";

/** Minimal org reference used in switcher lists (ancestors/siblings/children). */
export interface OrgSummary {
  id: string;
  name: string;
  slug: string;
  level: number;
  /** Whether the current user is a member of this org. */
  isMember: boolean;
  /** The user's role here, when a member (else null → read-only in the UI). */
  role: Role | null;
}

/** The active org's own fields. */
export interface OrgSelf {
  id: string;
  name: string;
  slug: string;
  level: number;
  brand_color: string;
  locale: string;
}

export interface SprintSummary {
  id: string;
  name: string;
  status: "planned" | "active" | "closed";
  start_date: string | null;
  end_date: string | null;
}

export interface BetSummary {
  id: string;
  title: string;
  status: "draft" | "active" | "scaled" | "pivoted" | "done" | "killed";
  signal: "strong" | "unclear" | "weak" | null;
  bet_type: "strategic" | "enabler";
}

/** Effective limits for the org, derived from the ROOT plan (rule #3). */
export interface OrgLimits {
  depthLimit: number;
  subAreaLimit: number | null;
  activeBetsLimit: number | null;
  currentSubAreas: number;
  canCreateSubArea: boolean;
}

/**
 * The single payload returned by GET /api/org/data — everything the app needs
 * to render an org view.
 */
export interface OrgData {
  org: OrgSelf;
  /** The current user's role in this org. */
  role: Role;
  /** Effective plan (root L1 plan), never the sub-org's own column. */
  rootPlan: Plan;
  /** root … immediate parent (read-only context). */
  ancestors: OrgSummary[];
  siblings: OrgSummary[];
  children: OrgSummary[];
  sprints: SprintSummary[];
  activeBets: BetSummary[];
  limits: OrgLimits;
}
