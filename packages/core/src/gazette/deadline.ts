import { firstKickoff, locksAt } from "../league/calendar";
import type { GameweekKickoff } from "../league/calendar";
import type { LeaguePeriod } from "../league/types";
import type { Deadline } from "./types";

/** The next lock a manager has to beat: the earliest lock still ahead, never the next period to open,
 *  which is a day later whenever a period opens on a Friday for a Saturday start. */
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
