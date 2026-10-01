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

import { MS_PER_DAY } from "../time";

/** The CADENCE we capture on, not an age we tolerate. Before the draft the pool
 *  barely moves and a weekly capture is plenty; once managers can add, drop and
 *  bench, every day is a day of history.
 *
 *  An age that has REACHED the cadence means a scheduled capture did not happen.
 *  `capture.yml` runs 05:10 UTC and `capture-status.yml` at 14:25, nine hours
 *  later, so there is no hour at which yesterday is the newest capture and
 *  today's is merely pending. */
const PRE_DRAFT_CADENCE_DAYS = 7;
const POST_DRAFT_CADENCE_DAYS = 1;

export interface CaptureStaleness {
  /** Most recent capture date (YYYY-MM-DD), or null if we have never captured. */
  lastCapture: string | null;
  /** Whole days since that capture; null when there is nothing to measure. */
  ageDays: number | null;
  /** How often we capture, given where we are in the season. Reaching it is
   *  already too long: it is the interval a capture was due within. */
  cadenceDays: number;
  overdue: boolean;
}

function days(from: string, to: string): number {
  return Math.floor((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / MS_PER_DAY);
}

/** Assess the capture history.
 *
 *  Dates are plain YYYY-MM-DD. `drafted` is Fantrax's own answer (`draftState`), never a date
 *  written down here. Never having captured is overdue: the point is to notice absence, and a
 *  run that reports "fine" on an empty directory would be exactly the silent failure this guards
 *  against. */
export function captureStaleness(
  captureDates: string[],
  today: string,
  drafted: boolean,
): CaptureStaleness {
  const cadenceDays = drafted ? POST_DRAFT_CADENCE_DAYS : PRE_DRAFT_CADENCE_DAYS;

  const lastCapture = captureDates.length === 0 ? null : [...captureDates].sort().at(-1) ?? null;
  if (lastCapture === null) {
    return { lastCapture: null, ageDays: null, cadenceDays, overdue: true };
  }

  const ageDays = days(lastCapture, today);
  // `>=`, not `>`. With `>` a daily cadence needed an age of two before it
  // complained, so the FIRST missed capture was reported healthy and the nine-hour
  // offset `capture-status.yml` was scheduled on bought nothing — the alarm came
  // thirty-three hours late instead of nine. It has already happened: the
  // rehearsal captures jump 6 Aug to 12 Aug, all of it post-draft, and the first
  // day of that outage passed green.
  return { lastCapture, ageDays, cadenceDays, overdue: ageDays >= cadenceDays };
}
