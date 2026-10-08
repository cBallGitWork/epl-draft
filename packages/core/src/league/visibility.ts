// Whether a lineup may be shown yet: a rival's arrangement hides until lineups lock, the squad never does.
// The reader's own lineup is always his. Pure: the instant is injected, never read from a clock.

import { instantOf } from "../time";
import { periodLock } from "./calendar";
import type { GameweekKickoff } from "./calendar";
import type { LeaguePeriod } from "./types";

/** What a roster view is allowed to render, with the reason when it withholds. */
export type RosterDisplay =
  | { show: "lineup"; period: number }
  /** Withheld until a lock, carrying the period judged: between rounds it differs from the round on screen. */
  | { show: "squad"; because: "not-locked"; period: number }
  | { show: "squad"; because: Exclude<SquadReason, "not-locked"> };

/** Why a lineup is being withheld; none of these is an error. */
export type SquadReason =
  /** Lineups have not locked yet. The ordinary case, most of every week. */
  | "not-locked"
  /** No lock could be found: a period with no football, or a round FPL has not dated. */
  | "unknown-lock"
  /** Fantrax did not tell us which period the roster belongs to. */
  | "unknown-period"
  /** We hold no calendar to check against. */
  | "no-calendar"
  /** The roster names a period the calendar does not contain. */
  | "period-not-in-calendar";

/** Have this period's lineups locked at `at` (inclusive)? Null when there is no lock: read it as "not yet".
 *  The lock is `locksAt` the first kickoff, never the period boundary, which opens hours before the first ball. */
function lineupsLocked(
  period: LeaguePeriod,
  kickoffs: readonly GameweekKickoff[],
  at: string,
): boolean | null {
  const locks = periodLock(period, kickoffs);
  const now = instantOf(at);
  if (locks === null || now === null) return null;
  return now >= Date.parse(locks);
}

/** The latest period whose lineups have locked, the default for a rival's squad; null before the first lock.
 *  Read in period order, so a payload out of order cannot hand back an early week. */
export function lastLockedPeriod(
  periods: LeaguePeriod[],
  kickoffs: readonly GameweekKickoff[],
  at: string,
): number | null {
  const ordered = [...periods].sort((a, b) => a.number - b.number);
  let latest: number | null = null;
  for (const period of ordered) {
    // `=== true`: null is a week with no lock to measure, and unknown is not locked.
    if (lineupsLocked(period, kickoffs, at) === true) latest = period.number;
  }
  return latest;
}

/** The earliest period whose lineups have not locked: the week a manager can still change.
 *  A period with no known lock is stepped over (`=== false`); null means "take what Fantrax considers open". */
export function planningPeriod(
  periods: LeaguePeriod[],
  kickoffs: readonly GameweekKickoff[],
  at: string,
): number | null {
  const ordered = [...periods].sort((a, b) => a.number - b.number);
  for (const period of ordered) {
    if (lineupsLocked(period, kickoffs, at) === false) return period.number;
  }
  return null;
}

/** The period to ask `getTeamRosters` for, or null (always safe) to read whatever Fantrax considers open.
 *  One ahead of Fantrax's open label is asked for outright; one behind it only once our calendar says it has
 *  locked, since the label can roll hours before the lock and both conditions are what keep a lineup hidden. */
export function periodToRead(
  /** The period the round on screen is scored in. */
  roundPeriod: number | null,
  /** The period Fantrax labelled a no-parameter read with: its own idea of which period is open. */
  openPeriod: number | null,
  periods: LeaguePeriod[],
  kickoffs: readonly GameweekKickoff[],
  at: string,
): number | null {
  if (roundPeriod === null || openPeriod === null) return null;
  if (roundPeriod === openPeriod) return null;
  if (roundPeriod > openPeriod) return roundPeriod;

  const period = periods.find((p) => p.number === roundPeriod);
  if (period === undefined) return null;

  // `=== true`: a null lock reads as "not locked", as it does in the gate below.
  return lineupsLocked(period, kickoffs, at) === true ? roundPeriod : null;
}

/** What to render for a roster Fantrax returned for `fetchedPeriod`, the period the payload declared.
 *  Fails safe to squad-only, naming why: a lineup shown early cannot be unshown. */
export function rosterDisplay(
  fetchedPeriod: number | null,
  periods: LeaguePeriod[],
  /** The season's kickoffs; the gate finds its own lock, since a lock passed in wrongly would fail open. */
  kickoffs: readonly GameweekKickoff[],
  at: string,
  /** Whether this roster is the signed-in reader's; a caller answering for the whole league must pass `false`. */
  yours: boolean,
): RosterDisplay {
  // His own team needs no clock; one with no named period falls through, since a lineup must name its period.
  if (yours && fetchedPeriod !== null) return { show: "lineup", period: fetchedPeriod };

  if (periods.length === 0) return { show: "squad", because: "no-calendar" };
  if (fetchedPeriod === null) return { show: "squad", because: "unknown-period" };

  const period = periods.find((p) => p.number === fetchedPeriod);
  if (!period) return { show: "squad", because: "period-not-in-calendar" };

  const locked = lineupsLocked(period, kickoffs, at);
  if (locked === null) return { show: "squad", because: "unknown-lock" };
  return locked
    ? { show: "lineup", period: fetchedPeriod }
    : { show: "squad", because: "not-locked", period: fetchedPeriod };
}
