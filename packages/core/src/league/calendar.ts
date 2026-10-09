import { LINEUP_LOCK_LEAD_MINUTES, SAVE_MARGIN_MINUTES } from "../config";
import { MS_PER_DAY, MS_PER_MINUTE, instantOf } from "../time";
import type { LeaguePeriod } from "./types";

// Which FPL gameweek falls in which Fantrax period, by kickoff (FPL's deadline lands a period early); kickoffs are
// plain data, never imported from `football/`. A postponed fixture stays in its FPL gameweek, while Fantrax
// scores it in the period it is played.

/** One fixture's kickoff, tagged with the gameweek FPL files it under. */
export interface GameweekKickoff {
  gameweek: number;
  /** ISO instant. FPL sends `Z`; Fantrax's period bounds carry `-0400`. */
  kickoff: string;
}

/** A period's gameweeks, ascending: none for a blank, two for a double. */
export interface PeriodGameweeks {
  period: number;
  gameweeks: number[];
  /** The gameweek the period is for: the most matches, the earliest first kickoff on a tie; null for a blank. */
  own: number | null;
}

/** The gameweek a period is for (`own`), never a replayed postponement's; undefined for a blank or a period the
 *  calendar lacks. */
export function openingGameweek(calendar: readonly PeriodGameweeks[], period: number | undefined): number | undefined {
  return calendar.find((entry) => entry.period === period)?.own ?? undefined;
}

/** The period that scores a gameweek: the first holding it, as a replayed postponement's period holds it too. */
export function periodOfGameweek(calendar: readonly PeriodGameweeks[], gameweek: number): PeriodGameweeks | undefined {
  return calendar.find((entry) => entry.gameweeks.includes(gameweek));
}

export function periodGameweeks(
  periods: LeaguePeriod[],
  kickoffs: GameweekKickoff[],
): PeriodGameweeks[] {
  const instants = kickoffs.flatMap((k) => {
    const at = instantOf(k.kickoff);
    return at === null ? [] : [{ gameweek: k.gameweek, at }];
  });

  return periods.map((period) => {
    const holds = periodHolds(period);
    const held = new Map<number, { matches: number; first: number }>();

    for (const { gameweek, at } of instants) {
      if (!holds(at)) continue;
      const seen = held.get(gameweek);
      held.set(gameweek, { matches: (seen?.matches ?? 0) + 1, first: Math.min(seen?.first ?? at, at) });
    }

    const own = [...held].sort(([gwA, a], [gwB, b]) => b.matches - a.matches || a.first - b.first || gwA - gwB)[0];
    return { period: period.number, gameweeks: [...held.keys()].sort((a, b) => a - b), own: own?.[0] ?? null };
  });
}

/** The fixtures a period scores, by kickoff and never by FPL's gameweek: a replayed postponement is in the period it is
 *  played in, and its gameweek's other matches are not. An undated fixture, or a period not given, is in none. */
export function periodFixtures<F extends { kickoff: string | null }>(period: LeaguePeriod | undefined, fixtures: readonly F[]): F[] {
  if (period === undefined) return [];
  const holds = periodHolds(period);
  return fixtures.filter((fixture) => holds(instantOf(fixture.kickoff ?? "")));
}

/** Whether a period holds an instant, inclusive at both ends: consecutive periods end at :59 and start at the next :00.
 *  Instants, never strings, as Fantrax's "-0400" and FPL's "Z" sort wrong lexically; an unread bound holds nothing. */
function periodHolds(period: LeaguePeriod): (at: number | null) => boolean {
  const start = instantOf(period.start);
  const end = instantOf(period.end);
  return (at) => at !== null && start !== null && end !== null && at >= start && at <= end;
}

// The league's lock is a set time before the period's first kickoff, never its boundary; Fantrax publishes the
// setting through no API, so the lead lives in `config.ts`. FPL's own deadline is never read here.

/** The lineup lock for a period whose first ball is at `firstKickoffIso`; null for an unparseable instant. */
export function locksAt(firstKickoffIso: string): string | null {
  const kickoff = instantOf(firstKickoffIso);
  return kickoff === null ? null : new Date(kickoff - LINEUP_LOCK_LEAD_MINUTES * MS_PER_MINUTE).toISOString();
}

/** Whether a lineup save may still be sent: until `SAVE_MARGIN_MINUTES` before the lock, never without one. */
export function saveOpen(locksAtIso: string | null, nowIso: string): boolean {
  const locks = locksAtIso === null ? null : instantOf(locksAtIso);
  const now = instantOf(nowIso);
  return locks !== null && now !== null && now < locks - SAVE_MARGIN_MINUTES * MS_PER_MINUTE;
}

/** The first ball kicked inside a period, or null for an international break or a period FPL has not dated. */
export function firstKickoff(
  period: LeaguePeriod,
  kickoffs: readonly GameweekKickoff[],
): string | null {
  const holds = periodHolds(period);
  let earliest: { iso: string; at: number } | null = null;
  for (const kickoff of kickoffs) {
    const at = instantOf(kickoff.kickoff);
    if (at === null || !holds(at)) continue;
    if (earliest === null || at < earliest.at) earliest = { iso: kickoff.kickoff, at };
  }
  return earliest?.iso ?? null;
}

/** A period's lineup lock, `locksAt` its first kickoff; null with no period, no dated football in it, or no lock. */
export function periodLock(period: LeaguePeriod | undefined, kickoffs: readonly GameweekKickoff[]): string | null {
  const kickoff = period === undefined ? null : firstKickoff(period, kickoffs);
  return kickoff === null ? null : locksAt(kickoff);
}

const LAST_SECOND = "23:59:59";

/** A period as whole days, `YYYY-MM-DD`, as Fantrax labels it ("4 (Sep 11 - Sep 17)"): one ending before
 *  a day's last second ends the day before, or the next gameweek's Friday night would count in it. */
export function periodDays(period: LeaguePeriod): { startDate: string; endDate: string } {
  const endDay = period.end.slice(0, 10);
  if (period.end.slice(11, 19) === LAST_SECOND) return { startDate: period.start.slice(0, 10), endDate: endDay };
  const [year, month, day] = endDay.split("-").map(Number);
  return { startDate: period.start.slice(0, 10), endDate: new Date(Date.UTC(year, month - 1, day) - MS_PER_DAY).toISOString().slice(0, 10) };
}
