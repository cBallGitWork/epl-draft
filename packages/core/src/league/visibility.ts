// Whether a lineup may be shown yet.
//
// The rule is a league rule, not a technical one: until a period starts, NO
// team's lineup is visible — not your rivals', not your own. Sixteen managers
// who can see each other's XI before the deadline are playing a different game
// from the one they agreed to, and the app is the only place that could leak
// it. What stays visible all week is the squad: the fifteen names, the pickups,
// who owns whom. Only the *arrangement* hides.
//
// Pure, with the instant injected (§5). Nothing here reads a clock, because a
// gate that consults `Date.now()` internally cannot be tested at its boundary,
// and its boundary is the only part that matters.

import type { LeaguePeriod } from "./types";

/** What a roster view is allowed to render.
 *
 *  A union rather than a boolean so the reason travels with the decision: the
 *  UI says "lineups lock until Friday" instead of silently showing less, and
 *  the caller cannot accidentally read a false as "no data". */
export type RosterDisplay =
  | { show: "lineup"; period: number }
  | { show: "squad"; because: SquadReason };

/** Why a lineup is being withheld. Every one of these is a real state we have
 *  seen or will see, and none of them is an error. */
export type SquadReason =
  /** The period has not started. The ordinary case, most of every week. */
  | "not-started"
  /** Fantrax did not tell us which period the roster belongs to. */
  | "unknown-period"
  /** We hold no calendar to check against. */
  | "no-calendar"
  /** The roster names a period the calendar does not contain. */
  | "period-not-in-calendar";

/** Fantrax sends `2026-08-21T15:00:00.0-0400`; our own timestamps are `Z`.
 *
 *  Both must become instants before they are compared. Comparing them as
 *  strings is the trap: lexically `"2026-08-21T15:00:00.0-0400"` sorts BELOW
 *  `"2026-08-21T18:00:00.000Z"`, while the instants run the other way — 19:00Z
 *  against 18:00Z. A string comparison gets the gate backwards at exactly the
 *  boundary it exists to guard, and gets it right everywhere else, which is
 *  what makes it survive a casual test.
 *
 *  Returns null rather than NaN so an unparseable date is a state the caller
 *  has to handle, not a comparison that silently answers false (§5). */
function instant(iso: string): number | null {
  const parsed = Date.parse(iso);
  return Number.isNaN(parsed) ? null : parsed;
}

/** Has this period begun at `at`? Null when either instant is unreadable.
 *
 *  Inclusive of the start: at exactly 20:00 the period is running. Fantrax's
 *  own end instant for the previous period is one second earlier, so there is
 *  no overlap to arbitrate. */
export function periodStarted(period: LeaguePeriod, at: string): boolean | null {
  const start = instant(period.start);
  const now = instant(at);
  if (start === null || now === null) return null;
  return now >= start;
}

/** The period containing `at`, or null if none does.
 *
 *  Null is a real answer, not a failure: before the season starts and in the
 *  gaps Fantrax leaves between periods, no period contains now. */
export function periodAt(periods: LeaguePeriod[], at: string): LeaguePeriod | null {
  const now = instant(at);
  if (now === null) return null;

  for (const period of periods) {
    const start = instant(period.start);
    const end = instant(period.end);
    if (start === null || end === null) continue;
    if (now >= start && now <= end) return period;
  }
  return null;
}

/** The highest-numbered period that has already begun, or null before the
 *  season opens.
 *
 *  Selected by number rather than by date so a calendar that arrives out of
 *  order — Fantrax sorts nothing — still answers correctly. */
export function latestStartedPeriod(
  periods: LeaguePeriod[],
  at: string,
): LeaguePeriod | null {
  let latest: LeaguePeriod | null = null;
  for (const period of periods) {
    if (periodStarted(period, at) !== true) continue;
    if (latest === null || period.number > latest.number) latest = period;
  }
  return latest;
}

/** May the lineup for `periodNumber` be shown at `at`?
 *
 *  False whenever we cannot prove otherwise — an unknown period, an unreadable
 *  date, an empty calendar. The asymmetry is deliberate: showing a lineup early
 *  cannot be undone, while hiding one that could have been shown costs a
 *  refresh. */
export function lineupVisible(
  periods: LeaguePeriod[],
  periodNumber: number,
  at: string,
): boolean {
  const period = periods.find((p) => p.number === periodNumber);
  if (!period) return false;
  return periodStarted(period, at) === true;
}

/** What to render for a roster Fantrax returned for `fetchedPeriod`.
 *
 *  Fails safe to squad-only, and says which safety it fell back on. The caller
 *  passes the period the roster payload itself declared, never one it inferred
 *  from the clock: the two disagree exactly when Fantrax is serving next
 *  period's roster early, which is the case this gate is for. */
export function rosterDisplay(
  fetchedPeriod: number | null,
  periods: LeaguePeriod[],
  at: string,
): RosterDisplay {
  if (periods.length === 0) return { show: "squad", because: "no-calendar" };
  if (fetchedPeriod === null) return { show: "squad", because: "unknown-period" };

  const period = periods.find((p) => p.number === fetchedPeriod);
  if (!period) return { show: "squad", because: "period-not-in-calendar" };

  return periodStarted(period, at) === true
    ? { show: "lineup", period: fetchedPeriod }
    : { show: "squad", because: "not-started" };
}
