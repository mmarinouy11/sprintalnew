/**
 * Sprint duration + cadence rules (spec sections 1.1 & 2.2).
 *
 * Defaults per org level are fixed by spec 2.2. The min/max BANDS are chosen
 * here (spec only locks the defaults) so users can override "within the allowed
 * range" — monotonic with the hierarchy: deeper levels run shorter sprints.
 */
export interface DurationBand {
  default: number;
  min: number;
  max: number;
}

export const DURATION_BY_LEVEL: Record<number, DurationBand> = {
  1: { default: 90, min: 30, max: 365 },
  2: { default: 30, min: 14, max: 90 },
  3: { default: 15, min: 7, max: 30 },
  4: { default: 7, min: 3, max: 14 },
};

/** Fallback band for any unexpected level. */
const FALLBACK_BAND: DurationBand = { default: 30, min: 7, max: 90 };

export function durationBandForLevel(level: number): DurationBand {
  return DURATION_BY_LEVEL[level] ?? FALLBACK_BAND;
}

export function defaultDurationForLevel(level: number): number {
  return durationBandForLevel(level).default;
}

export function isDurationValidForLevel(level: number, days: number): boolean {
  const band = durationBandForLevel(level);
  return Number.isInteger(days) && days >= band.min && days <= band.max;
}

/** Signal check cadence = duration_days / 6 (spec 1.1). */
export const SIGNAL_CHECK_DIVISOR = 6;

/** Strategic reviews happen 3x per sprint at these % of duration (spec 1.1). */
export const REVIEW_MILESTONES = [33, 66, 90] as const;
export type ReviewMilestone = (typeof REVIEW_MILESTONES)[number];
