import { LINEUP_LOCK_LEAD_MINUTES } from "../config";
import type { LeaguePeriod } from "./types";

// Which FPL gameweek falls inside which Fantrax scoring period.
//
// This is the league layer's second seam onto the football layer, and the only
// one that is not player identity. It stays a seam rather than a dependency: this
// file imports nothing from `football/` and declares the football facts it needs
// as plain data, exactly as `identity/candidates.ts` declares `FplCandidate`
// rather than importing `FootballPlayer`. The caller is told to supply kickoffs;
// where they came from is not this file's business.
//
// **Measured by kickoff, and that matters.** The obvious test — does FPL's
// deadline fall inside the period? — says the two calendars disagree everywhere:
// each deadline lands one period early (period 1 holds gameweek 2's), and around
// the September break period 3 gets no gameweek while period 4 gets two. Fantrax's
// boundary sits inside the 90-minute gap between FPL's deadline and that
// gameweek's first kickoff, which is what puts the deadline on the wrong side of
// it. By kickoff, all 38 periods align exactly with the identically numbered
// gameweek, across all 380 fixtures. See `calendar.test.ts`.
//
// Postponements are the known future divergence: FPL keeps a rearranged fixture in
// its original `event`, while Fantrax scores it in the period it was actually
// played. That is a real disagreement about the football, not a bug here.

/** One fixture's kickoff, tagged with the gameweek FPL files it under. */
export interface GameweekKickoff {
  gameweek: number;
  /** ISO instant. FPL sends `Z`; Fantrax's period bounds carry `-0400`. */
  kickoff: string;
}

/** Zero and two are both possible answers — a blank period and a double — which
 *  is why this is a list and not a number. */
export interface PeriodGameweeks {
  period: number;
  gameweeks: number[];
}

/** A period's first gameweek, the one that opens a double; undefined for a period the calendar lacks or a blank. */
export function openingGameweek(calendar: readonly PeriodGameweeks[], period: number | undefined): number | undefined {
  return calendar.find((entry) => entry.period === period)?.gameweeks[0];
}

export function periodGameweeks(
  periods: LeaguePeriod[],
  kickoffs: GameweekKickoff[],
): PeriodGameweeks[] {
  // Compare instants, never strings. Fantrax's "…T15:00:00.0-0400" and FPL's
  // "…T19:00:00Z" are the same moment and sort the wrong way lexically.
  const instants = kickoffs
    .map((k) => ({ gameweek: k.gameweek, at: Date.parse(k.kickoff) }))
    .filter((k) => Number.isFinite(k.at));

  return periods.map((period) => {
    const start = Date.parse(period.start);
    const end = Date.parse(period.end);
    const gameweeks = new Set<number>();

    // Inclusive at both ends: consecutive periods end at :59 and start at the
    // next :00, so they leave a one-second gap rather than overlapping.
    for (const { gameweek, at } of instants) {
      if (at >= start && at <= end) gameweeks.add(gameweek);
    }

    return { period: period.number, gameweeks: [...gameweeks].sort((a, b) => a - b) };
  });
}

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

const LAST_SECOND = "23:59:59";
const MS_PER_DAY = 86_400_000;

/** A period as whole days, `YYYY-MM-DD`, as Fantrax labels it ("4 (Sep 11 - Sep 17)"): one ending before
 *  a day's last second ends the day before, or the next gameweek's Friday night would count in it. */
export function periodDays(period: LeaguePeriod): { startDate: string; endDate: string } {
  const endDay = period.end.slice(0, 10);
  if (period.end.slice(11, 19) === LAST_SECOND) return { startDate: period.start.slice(0, 10), endDate: endDay };
  const [year, month, day] = endDay.split("-").map(Number);
  return { startDate: period.start.slice(0, 10), endDate: new Date(Date.UTC(year, month - 1, day) - MS_PER_DAY).toISOString().slice(0, 10) };
}
