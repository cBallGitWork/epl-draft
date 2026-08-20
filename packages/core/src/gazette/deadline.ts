import { LINEUP_LOCK_LEAD_MINUTES } from "../config";
import type { GameweekKickoff } from "../league/calendar";
import type { LeaguePeriod } from "../league/types";
import type { Deadline } from "./types";

// When lineups lock next.
//
// **Fifteen minutes before the period's FIRST KICKOFF**, which is the league's
// own setting, read off the commissioner's settings page on 20 Aug 2026:
// `lineupLockType` is "Set amount of time before 1st game of period" and
// `lineupLockTimeBeforeGame` is 0:15. Fantrax publishes neither through any API
// we can read, which is why the fifteen lives in `config.ts`.
//
// **It is not fifteen minutes before the period boundary, and this file used to
// compute it that way.** The boundary and the first kickoff coincide only when
// the gameweek has a Friday night match. Probed across the live calendar:
// periods 1, 2, 3 and 5 open exactly at their 20:00 kickoff, while period 4
// opens Fri 11 Sep 11:00 for a round that starts Sat 12 Sep 15:00, and period 6
// — the real league's first — opens Fri 9 Oct 11:00 for a round starting Sat 10
// Oct 12:30. Reading the boundary as the kickoff put the announced deadline a
// day early for most of the season.
//
// That is why the kickoffs are an argument. This file declares `GameweekKickoff`
// through `league/calendar` rather than importing a `Fixture`: the same one-way
// seam the period↔gameweek mapping runs on, and the caller is told to supply
// the football calendar.
//
// FPL's own deadline is FPL's house rule — ninety minutes, and a different
// number — and is never read here.

/** Lineups lock this long before the first ball is kicked.
 *
 *  Split out because two screens print it and they must never disagree: the
 *  paper's masthead announces the next one and the schedule dates every round by
 *  it. Null for an instant that will not parse, rather than one computed from
 *  `NaN` — which formats as "Invalid Date" and reads like a deadline. */
export function locksAt(firstKickoffIso: string): string | null {
  const kickoff = Date.parse(firstKickoffIso);
  return Number.isNaN(kickoff)
    ? null
    : new Date(kickoff - LINEUP_LOCK_LEAD_MINUTES * 60_000).toISOString();
}

/** The first ball kicked inside a period, or null for one with no football in
 *  it — an international break, or a period FPL has not dated. */
export function firstKickoff(
  period: LeaguePeriod,
  kickoffs: readonly GameweekKickoff[],
): string | null {
  // Instants, never strings: the league's bounds carry -0400 and FPL's carry Z,
  // and the two sort the wrong way lexically.
  const start = Date.parse(period.start);
  const end = Date.parse(period.end);
  if (Number.isNaN(start) || Number.isNaN(end)) return null;

  let earliest: { iso: string; at: number } | null = null;
  for (const kickoff of kickoffs) {
    const at = Date.parse(kickoff.kickoff);
    if (Number.isNaN(at) || at < start || at > end) continue;
    if (earliest === null || at < earliest.at) earliest = { iso: kickoff.kickoff, at };
  }
  return earliest?.iso ?? null;
}

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
