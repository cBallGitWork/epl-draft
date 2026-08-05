// How long since we last recorded the league's state, and whether that is too
// long. Pure — dates arrive as arguments, never from a clock, so the boundaries
// are testable.
//
// Why this file exists at all: roster transitions cannot be backfilled. Fantrax
// serves current state only, so a day we fail to capture is a day gone. The
// sibling project's per-gameweek capture died silently at GW35 and was rescued
// only because FPL's bootstrap is a public URL the Internet Archive crawls;
// nothing crawls our league. Silent failure is the actual risk, so staleness is
// something a human can see rather than something we hope about.

/** Before the draft the pool barely moves and a weekly capture is plenty. Once
 *  managers can add, drop and bench, every day is a day of history. */
const PRE_DRAFT_MAX_AGE_DAYS = 7;
const POST_DRAFT_MAX_AGE_DAYS = 1;

const MS_PER_DAY = 86_400_000;

export interface CaptureStaleness {
  /** Most recent capture date (YYYY-MM-DD), or null if we have never captured. */
  lastCapture: string | null;
  /** Whole days since that capture; null when there is nothing to measure. */
  ageDays: number | null;
  /** Days we are allowed to go without capturing, given where we are in the season. */
  maxAgeDays: number;
  overdue: boolean;
}

function days(from: string, to: string): number {
  return Math.floor((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / MS_PER_DAY);
}

/** Assess the capture history.
 *
 *  All three dates are plain YYYY-MM-DD. Never having captured is overdue: the
 *  point is to notice absence, and a run that reports "fine" on an empty
 *  directory would be exactly the silent failure this guards against. */
export function captureStaleness(
  captureDates: string[],
  today: string,
  draftDate: string,
): CaptureStaleness {
  const maxAgeDays =
    days(draftDate, today) >= 0 ? POST_DRAFT_MAX_AGE_DAYS : PRE_DRAFT_MAX_AGE_DAYS;

  const lastCapture = captureDates.length === 0 ? null : [...captureDates].sort().at(-1) ?? null;
  if (lastCapture === null) {
    return { lastCapture: null, ageDays: null, maxAgeDays, overdue: true };
  }

  const ageDays = days(lastCapture, today);
  return { lastCapture, ageDays, maxAgeDays, overdue: ageDays > maxAgeDays };
}
