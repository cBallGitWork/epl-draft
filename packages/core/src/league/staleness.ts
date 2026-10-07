// How long since we last captured the league's state, and whether that is too long: Fantrax serves current state
// only, so a missed day cannot be backfilled. Pure: dates arrive as arguments.

import { MS_PER_DAY } from "../time";

/** The cadence we capture on, weekly before the draft and daily after; an age that reaches it is a missed capture.
 *  `capture-status.yml` runs nine hours after `capture.yml`, so yesterday's is never merely pending. */
const PRE_DRAFT_CADENCE_DAYS = 7;
const POST_DRAFT_CADENCE_DAYS = 1;

export interface CaptureStaleness {
  /** Most recent capture date (YYYY-MM-DD), or null if we have never captured. */
  lastCapture: string | null;
  /** Whole days since that capture; null when there is nothing to measure. */
  ageDays: number | null;
  /** How often we capture, given where we are in the season; reaching it is already too long. */
  cadenceDays: number;
  overdue: boolean;
}

function days(from: string, to: string): number {
  return Math.floor((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / MS_PER_DAY);
}

/** Assess the capture history (YYYY-MM-DD dates); `drafted` is Fantrax's own `draftState`, never a written date.
 *  Never having captured is overdue. */
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
  // `>=`, not `>`: with `>` the first missed daily capture would pass as healthy.
  return { lastCapture, ageDays, cadenceDays, overdue: ageDays >= cadenceDays };
}
