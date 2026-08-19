// Whether a lineup may be shown yet.
//
// The rule is a league rule, not a technical one: until a period starts, no
// RIVAL's lineup is visible. Sixteen managers who can see each other's XI before
// the deadline are playing a different game from the one they agreed to, and the
// app is the only place that could leak it. What stays visible all week is the
// squad: the fifteen names, the pickups, who owns whom. Only the *arrangement*
// hides.
//
// Your own is a different question and it took a while to see it. This gate used
// to withhold every lineup from everybody, the reader's own included, on the
// grounds that one rule is safer than two. What that actually cost was the only
// thing the app could usefully do with a lineup — let a manager plan his own
// before the deadline — to protect information he is already looking at in
// Fantrax. Nobody is kept from anything by hiding a man's team from himself.
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
 *  Returns null rather than NaN so an unreadable date is a state the caller has
 *  to handle, not a comparison that silently answers false (§5). */
function instant(iso: string): number | null {
  const parsed = Date.parse(iso);
  return Number.isNaN(parsed) ? null : parsed;
}

/** Has this period begun at `at`? Null when either instant is unreadable.
 *
 *  Inclusive of the start: at exactly 20:00 the period is running. Fantrax's
 *  own end instant for the previous period is one second earlier, so there is
 *  no overlap to arbitrate. */
function periodStarted(period: LeaguePeriod, at: string): boolean | null {
  const start = instant(period.start);
  const now = instant(at);
  if (start === null || now === null) return null;
  return now >= start;
}

/** What to render for a roster Fantrax returned for `fetchedPeriod`.
 *
 *  Fails safe to squad-only, and says which safety it fell back on. Showing a
 *  lineup early cannot be undone, while hiding one that could have been shown
 *  costs a refresh.
 *
 *  The caller passes the period the roster payload itself declared, never one
 *  inferred from the clock: the two disagree exactly when Fantrax is serving
 *  next period's roster early, which is the case this gate is for. */
export function rosterDisplay(
  fetchedPeriod: number | null,
  periods: LeaguePeriod[],
  at: string,
  /** Whether this roster belongs to the reader.
   *
   *  Answered from the session's team id, which is validated against the
   *  league's own roster before it gets here — so the only way to be handed
   *  `true` is to be that manager. Callers that answer for the whole league at
   *  once, rather than for one team a known reader is looking at, must pass
   *  `false`: a shared answer is a rival's answer to fifteen of the sixteen. */
  yours: boolean,
): RosterDisplay {
  // No calendar needed, and no clock: it is his team, and it is his all week.
  // A roster whose period Fantrax would not name still falls through, because
  // `show: "lineup"` has to say which period it is showing.
  if (yours && fetchedPeriod !== null) return { show: "lineup", period: fetchedPeriod };

  if (periods.length === 0) return { show: "squad", because: "no-calendar" };
  if (fetchedPeriod === null) return { show: "squad", because: "unknown-period" };

  const period = periods.find((p) => p.number === fetchedPeriod);
  if (!period) return { show: "squad", because: "period-not-in-calendar" };

  return periodStarted(period, at) === true
    ? { show: "lineup", period: fetchedPeriod }
    : { show: "squad", because: "not-started" };
}
