import { LINEUP_LOCK_LEAD_MINUTES, SAVE_MARGIN_MINUTES } from "../config";
import { MS_PER_DAY } from "../time";
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

/** A period's gameweeks: none for a blank, two for a double. */
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
  // Instants, never strings: Fantrax's "-0400" and FPL's "Z" sort the wrong way lexically.
  const instants = kickoffs
    .map((k) => ({ gameweek: k.gameweek, at: Date.parse(k.kickoff) }))
    .filter((k) => Number.isFinite(k.at));

  return periods.map((period) => {
    const start = Date.parse(period.start);
    const end = Date.parse(period.end);
    const gameweeks = new Set<number>();

    // Inclusive at both ends: consecutive periods end at :59 and start at the next :00.
    for (const { gameweek, at } of instants) {
      if (at >= start && at <= end) gameweeks.add(gameweek);
    }

    return { period: period.number, gameweeks: [...gameweeks].sort((a, b) => a - b) };
  });
}

// The league's lock is a set time before the period's first kickoff, never its boundary; Fantrax publishes the
// setting through no API, so the lead lives in `config.ts`. FPL's own deadline is never read here.

/** The lineup lock for a period whose first ball is at `firstKickoffIso`; null for an unparseable instant. */
export function locksAt(firstKickoffIso: string): string | null {
  const kickoff = Date.parse(firstKickoffIso);
  return Number.isNaN(kickoff)
    ? null
    : new Date(kickoff - LINEUP_LOCK_LEAD_MINUTES * 60_000).toISOString();
}

/** Whether a lineup save may still be sent: until `SAVE_MARGIN_MINUTES` before the lock, never without one. */
export function saveOpen(locksAtIso: string | null, nowIso: string): boolean {
  const locks = locksAtIso === null ? NaN : Date.parse(locksAtIso);
  const now = Date.parse(nowIso);
  return !Number.isNaN(locks) && !Number.isNaN(now) && now < locks - SAVE_MARGIN_MINUTES * 60_000;
}

/** The first ball kicked inside a period, or null for an international break or a period FPL has not dated. */
export function firstKickoff(
  period: LeaguePeriod,
  kickoffs: readonly GameweekKickoff[],
): string | null {
  // Instants, never strings: the league's -0400 and FPL's Z sort the wrong way lexically.
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

/** A period as whole days, `YYYY-MM-DD`, as Fantrax labels it ("4 (Sep 11 - Sep 17)"): one ending before
 *  a day's last second ends the day before, or the next gameweek's Friday night would count in it. */
export function periodDays(period: LeaguePeriod): { startDate: string; endDate: string } {
  const endDay = period.end.slice(0, 10);
  if (period.end.slice(11, 19) === LAST_SECOND) return { startDate: period.start.slice(0, 10), endDate: endDay };
  const [year, month, day] = endDay.split("-").map(Number);
  return { startDate: period.start.slice(0, 10), endDate: new Date(Date.UTC(year, month - 1, day) - MS_PER_DAY).toISOString().slice(0, 10) };
}
