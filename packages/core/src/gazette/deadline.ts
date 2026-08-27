import { firstKickoff, locksAt } from "../league/calendar";
import type { GameweekKickoff } from "../league/calendar";
import type { LeaguePeriod } from "../league/types";
import type { Deadline } from "./types";

/** The next lock a manager has to beat.
 *
 *  The earliest lock still in the future, and deliberately not "the next period
 *  to open". Those differ for a whole day every time a period opens on the
 *  Friday for a round that starts on the Saturday: at Friday lunchtime the next
 *  period to open is next week's, while the deadline a manager actually has to
 *  beat is tomorrow afternoon's. */
export function nextDeadline(
  periods: readonly LeaguePeriod[],
  kickoffs: readonly GameweekKickoff[],
  nowIso: string,
): Deadline | null {
  const now = Date.parse(nowIso);
  if (Number.isNaN(now)) return null;

  let next: Deadline | null = null;
  for (const period of periods) {
    const kickoff = firstKickoff(period, kickoffs);
    if (kickoff === null) continue;

    const locks = locksAt(kickoff);
    if (locks === null || Date.parse(locks) <= now) continue;

    if (next === null || Date.parse(locks) < Date.parse(next.locksAt)) {
      next = { period: period.number, at: kickoff, locksAt: locks };
    }
  }

  return next;
}
