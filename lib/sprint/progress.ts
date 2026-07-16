import { REVIEW_MILESTONES, SIGNAL_CHECK_DIVISOR, type ReviewMilestone } from "./limits";

/**
 * Pure sprint date math (spec 1.1). No I/O — safe on client and server.
 * Dates are handled at UTC-day granularity so results don't drift by timezone.
 */

/** The subset of a sprint these helpers need. */
export interface SprintTiming {
  start_date: string | null;
  end_date: string | null;
  duration_days: number | null;
}

const MS_PER_DAY = 86_400_000;

/** Parse a 'YYYY-MM-DD' date (or any date string) to UTC midnight. */
function toDate(value: string): Date {
  return new Date(value);
}

/** Floor a moment to its UTC-midnight day. */
function utcMidnight(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function addDays(base: Date, days: number): Date {
  return new Date(base.getTime() + days * MS_PER_DAY);
}

function diffDays(a: Date, b: Date): number {
  return Math.floor((a.getTime() - b.getTime()) / MS_PER_DAY);
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

function endOf(sprint: SprintTiming, start: Date, duration: number): Date {
  return sprint.end_date ? toDate(sprint.end_date) : addDays(start, duration);
}

export interface SprintProgress {
  percent: number;
  daysElapsed: number;
  daysRemaining: number;
}

/**
 * How far through a sprint we are, at UTC-day granularity. Clamped so a sprint
 * that hasn't started reads 0% and a past-end sprint reads 100%.
 */
export function sprintProgress(
  sprint: SprintTiming,
  now: Date = new Date(),
): SprintProgress {
  const duration = sprint.duration_days ?? 0;
  if (!sprint.start_date || duration <= 0) {
    return { percent: 0, daysElapsed: 0, daysRemaining: Math.max(0, duration) };
  }
  const start = toDate(sprint.start_date);
  const today = utcMidnight(now);
  const daysElapsed = clamp(diffDays(today, start), 0, duration);
  const daysRemaining = Math.max(0, duration - daysElapsed);
  const percent = clamp(Math.round((daysElapsed / duration) * 100), 0, 100);
  return { percent, daysElapsed, daysRemaining };
}

/**
 * When the next signal check is due. Cadence = duration_days / 6 (spec 1.1).
 * Based on the last check if given, else one cadence after the start. Returns
 * null once the next check would fall past the sprint end.
 */
export function nextSignalCheckDue(
  sprint: SprintTiming,
  lastCheckAt?: string | null,
): Date | null {
  const duration = sprint.duration_days ?? 0;
  if (!sprint.start_date || duration <= 0) return null;

  const cadenceDays = duration / SIGNAL_CHECK_DIVISOR;
  const base = lastCheckAt ? toDate(lastCheckAt) : toDate(sprint.start_date);
  const next = addDays(base, cadenceDays);
  const end = endOf(sprint, toDate(sprint.start_date), duration);
  return next.getTime() > end.getTime() ? null : next;
}

export interface ReviewMilestoneDue {
  milestone: ReviewMilestone;
  dueAt: Date;
}

/**
 * The next strategic review milestone (33% / 66% / 90% of duration, spec 1.1).
 * Returns the first milestone not yet covered by lastReviewAt, or null when all
 * three are done.
 */
export function nextStrategicReviewMilestone(
  sprint: SprintTiming,
  lastReviewAt?: string | null,
): ReviewMilestoneDue | null {
  const duration = sprint.duration_days ?? 0;
  if (!sprint.start_date || duration <= 0) return null;

  const start = toDate(sprint.start_date);
  const last = lastReviewAt ? toDate(lastReviewAt) : null;

  for (const milestone of REVIEW_MILESTONES) {
    const dueAt = addDays(start, (duration * milestone) / 100);
    if (!last || dueAt.getTime() > last.getTime()) {
      return { milestone, dueAt };
    }
  }
  return null;
}
