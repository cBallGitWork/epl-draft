// Whether a lineup may be shown yet.
//
// The rule is a league rule, not a technical one: until lineups LOCK, no RIVAL's
// lineup is visible. Sixteen managers who can see each other's XI before
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

import { firstKickoff, locksAt } from "./calendar";
import type { GameweekKickoff } from "./calendar";
import type { LeaguePeriod } from "./types";

/** What a roster view is allowed to render.
 *
 *  A union rather than a boolean so the reason travels with the decision: the
 *  UI says "lineups lock until Friday" instead of silently showing less, and
 *  the caller cannot accidentally read a false as "no data". */
export type RosterDisplay =
  | { show: "lineup"; period: number }
  /** Withheld because a lock is still ahead — and it carries WHICH period's
   *  lock, because that is the one reason a reader is owed a number and the one
   *  the copy used to fetch from somewhere else. The route knows the round it is
   *  drawing; only the gate knows the period it judged, and between rounds those
   *  are different numbers. A decision that does not carry its own subject
   *  invites the caller to supply the nearest one to hand. */
  | { show: "squad"; because: "not-locked"; period: number }
  | { show: "squad"; because: Exclude<SquadReason, "not-locked"> };

/** Why a lineup is being withheld. Every one of these is a real state we have
 *  seen or will see, and none of them is an error. */
export type SquadReason =
  /** Lineups have not locked yet. The ordinary case, most of every week. */
  | "not-locked"
  /** We could not work out when this period's lineups lock — a period with no
   *  football in it, or a round FPL has not dated. Ours failing to read
   *  something, never the rule. */
  | "unknown-lock"
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

/** Have this period's lineups locked at `at`? Null when there is no lock to
 *  measure, which the caller must read as "not yet" and never as "yes".
 *
 *  **Not the period boundary, and that was the bug.** Fantrax opens a roster
 *  period on the Friday MORNING for a round that starts on the Saturday — 33 of
 *  this season's 38 — while lineups lock fifteen minutes before the first ball.
 *  Reading the boundary published every rival's arrangement for the day and a bit
 *  in between. The four weeks where the two agree are the ones with a Friday-night
 *  match, and which weeks those are moves with the television schedule, so the
 *  answer has to be computed rather than tuned.
 *
 *  Built from `locksAt` and `firstKickoff` rather than from `firstKickoff` less
 *  fifteen spelled out again, so the instant this gate opens on and the instant
 *  the masthead and the schedule print cannot drift apart.
 *
 *  Inclusive of the lock: at exactly the lock, lineups are locked. */
function lineupsLocked(
  period: LeaguePeriod,
  kickoffs: readonly GameweekKickoff[],
  at: string,
): boolean | null {
  const kickoff = firstKickoff(period, kickoffs);
  if (kickoff === null) return null;

  const locks = locksAt(kickoff);
  const now = instant(at);
  if (locks === null || now === null) return null;
  return now >= Date.parse(locks);
}

/** The most recent period whose lineups HAVE locked — the last week whose
 *  arrangements are public.
 *
 *  **The default a rival's squad screen wants** (Craig, 2 Sep, several times:
 *  "tap league, tap a squad… this needs the pitch view too"). `planningPeriod`
 *  is the right answer for your OWN team, whose planner is about the week you
 *  can still change — but pointing a rival's screen at that week guarantees the
 *  gate withholds it, so the pitch was never once visible from an ordinary tap.
 *  A screen whose whole subject is an arrangement should open on a week that
 *  HAS one.
 *
 *  Mid-round the two coincide: once Saturday's lock passes, the live week is
 *  both the last locked one and the one being played, which is exactly what a
 *  reader wants on a matchday.
 *
 *  Null before the season's first lock — nobody has arranged anything yet — and
 *  the caller falls back to the planning week, which is all there is to show.
 *
 *  Read in period order and taken from the END, so a payload that arrived out of
 *  order cannot hand back an early week. */
export function lastLockedPeriod(
  periods: LeaguePeriod[],
  kickoffs: readonly GameweekKickoff[],
  at: string,
): number | null {
  const ordered = [...periods].sort((a, b) => a.number - b.number);
  let latest: number | null = null;
  for (const period of ordered) {
    // `=== true` and not truthiness, on `planningPeriod`'s rule: null is a week
    // with no lock to measure, and unknown is not locked.
    if (lineupsLocked(period, kickoffs, at) === true) latest = period.number;
  }
  return latest;
}

/** The first period whose lineups have NOT locked — the week a manager can still
 *  change, and therefore the week the squad screens are about.
 *
 *  Mid-round the two are not the same week. Fantrax goes on serving the live
 *  period to a no-parameter read all weekend, so a squad screen that takes what
 *  it is given shows an arrangement nobody can alter, under a running score that
 *  belongs to the matchday board. What a manager opens Squads FOR is the eleven
 *  he can still pick.
 *
 *  `=== false` and not a truthiness test, for the reason the gate below has:
 *  `lineupsLocked` answers null for a period it cannot find a lock in — a week
 *  with no football, or one FPL has not dated — and unknown is not "still open".
 *  Such a period is stepped over, and a season of them answers null, which the
 *  caller reads as "take whatever Fantrax considers open".
 *
 *  Periods are read in their own order rather than the list's: the answer is the
 *  EARLIEST unlocked week, and a payload that arrived out of order would
 *  otherwise hand back whichever one came first. */
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

/** The period to ask `getTeamRosters` for, or null to read whatever Fantrax
 *  currently considers open.
 *
 *  **A period AHEAD of Fantrax's label is asked for outright.** It is the week
 *  the squad screens are about (`planningPeriod`), Fantrax honours the parameter
 *  for it, and nothing is leaked by reading it: an unlocked period fails the
 *  gate below for every team but the reader's own, so a rival's next arrangement
 *  is withheld exactly as this week's was before it locked. The safety argument
 *  that follows is about the other direction, where reading early WOULD publish
 *  something.
 *
 *  Two conditions, and the conjunction is the entire safety argument.
 *
 *  **Fantrax's own open label must be past it.** Only the open period takes
 *  changes, so a period behind it is one nobody can still edit. Proved rather
 *  than assumed, on 28 Aug: a claim and a lineup move were both made on `test2`
 *  that day, and `?period=1` went on serving the dropped forward AND the benched
 *  midfielder while `?period=2` carried both. Membership and `status` are each
 *  versioned — and `status` is the only field this file withholds, so it is the
 *  half that had to be proved and the half a squad list cannot show you.
 *
 *  **And our own calendar must say that period has locked.** The label alone
 *  will not do, because it rolls on Fantrax's schedule rather than on ours: on
 *  the live calendar two of the season's 38 periods see it roll as much as 19
 *  hours before their own lock. In that window the first condition holds while
 *  the round has not started, and reading it would publish an arrangement
 *  sixteen managers are still free to change. The second condition is false
 *  throughout every such window by construction — which is why this is a
 *  conjunction and not a preference between two signals.
 *
 *  Null is always the safe answer: the caller reads the open period, which is
 *  what it did before any of this existed. */
export function periodToRead(
  /** The period the round on screen is scored in. */
  roundPeriod: number | null,
  /** The period Fantrax labelled a no-parameter read with — its own idea of
   *  which period is open, which runs ahead of the calendar and is the only
   *  place that number can come from. */
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

  // `=== true` and not a truthiness test: `lineupsLocked` answers null when it
  // cannot find a lock, and null must read as "not locked" here exactly as it
  // does in the gate below.
  return lineupsLocked(period, kickoffs, at) === true ? roundPeriod : null;
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
  /** The season's kickoffs. The gate finds its own lock from these rather than
   *  being handed one: a caller that passed the wrong period's lock would fail
   *  OPEN, and on an information boundary that asymmetry decides it. */
  kickoffs: readonly GameweekKickoff[],
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

  const locked = lineupsLocked(period, kickoffs, at);
  if (locked === null) return { show: "squad", because: "unknown-lock" };
  return locked
    ? { show: "lineup", period: fetchedPeriod }
    : { show: "squad", because: "not-locked", period: fetchedPeriod };
}
