import { describe, expect, it } from "vitest";
import { rosterDisplay } from "./visibility";
import type { GameweekKickoff } from "./calendar";
import type { LeaguePeriod } from "./types";

// Verbatim from data/snapshots/fantrax/leagues/real/2026-08-27/getLeagueInfo.json.
//
// **The old fixture held periods 1 and 2 only, and that is why this survived.**
// Both open at their own Friday-night kickoff, which are two of the four weeks
// where the boundary and the lock happen to agree. A fixture built from those
// cannot tell the two rules apart. Period 4 and period 6 open on the Friday
// MORNING for a Saturday round, which is the other 33.
const periods: LeaguePeriod[] = [
  { number: 1, start: "2026-08-21T15:00:00.0-0400", end: "2026-08-28T14:59:58.0-0400" },
  { number: 2, start: "2026-08-28T15:00:00.0-0400", end: "2026-09-04T14:59:58.0-0400" },
  { number: 3, start: "2026-09-04T15:00:00.0-0400", end: "2026-09-11T05:59:58.0-0400" },
  { number: 4, start: "2026-09-11T06:00:00.0-0400", end: "2026-09-18T14:59:58.0-0400" },
  { number: 6, start: "2026-10-09T06:00:00.0-0400", end: "2026-10-16T05:59:58.0-0400" },
];

// Declared here and never read from FPL: this file tests the RULE, and FPL moves
// a round for television. Gameweek 8's first kickoff has already moved onto a
// Friday since the season alignment fixture was recorded, which flipped period 8
// from unsafe to safe — so which weeks are which is not a fact to hard-code.
const kickoffs: GameweekKickoff[] = [
  { gameweek: 1, kickoff: "2026-08-21T19:00:00Z" },
  { gameweek: 2, kickoff: "2026-08-28T19:00:00Z" },
  { gameweek: 3, kickoff: "2026-09-04T19:00:00Z" },
  { gameweek: 4, kickoff: "2026-09-12T14:00:00Z" },
  { gameweek: 6, kickoff: "2026-10-10T11:30:00Z" },
];

/** Fifteen minutes before each period's first ball — what the masthead prints. */
const P1_LOCKS = "2026-08-21T18:45:00.000Z";
const P4_LOCKS = "2026-09-12T13:45:00.000Z";
const BEFORE_THE_SEASON = "2026-08-12T12:00:00.000Z";

/** One millisecond, as an instant. */
const justBefore = (iso: string) => new Date(Date.parse(iso) - 1).toISOString();

describe("rosterDisplay", () => {
  it("hides every lineup before lineups lock", () => {
    expect(rosterDisplay(1, periods, kickoffs, BEFORE_THE_SEASON, false)).toEqual({
      show: "squad",
      because: "not-locked",
      period: 1,
    });
  });

  it("reveals the lineup at the very instant lineups lock", () => {
    expect(rosterDisplay(1, periods, kickoffs, P1_LOCKS, false)).toEqual({
      show: "lineup",
      period: 1,
    });
  });

  it("is still hiding it one millisecond earlier", () => {
    expect(rosterDisplay(1, periods, kickoffs, justBefore(P1_LOCKS), false).show).toBe("squad");
  });

  // THE TRAP, and it did not go away when the anchor moved — it moved inside
  // `firstKickoff`, which compares FPL's `Z` kickoffs against the period's
  // `-0400` bounds. Lexically "…T15:00:00.0-0400" sorts BELOW "…T18:00:00.000Z"
  // while the instants run the other way: 19:00Z against 18:00Z. A string
  // comparison would agree with the right answer at every other moment of the
  // week, which is what lets it survive a careless test.
  it("compares instants, not strings — 18:00Z is BEFORE a 15:00-0400 start", () => {
    const anHourBefore = "2026-08-21T18:00:00.000Z";

    expect(periods[0].start < anHourBefore).toBe(true);

    expect(rosterDisplay(1, periods, kickoffs, anHourBefore, false).show).toBe("squad");
  });

  it("still hides a LATER period while an earlier one is running", () => {
    // On Tuesday of gameweek 1, this week's XI is public and next week's is not.
    const midPeriod1 = "2026-08-25T12:00:00.000Z";
    expect(rosterDisplay(1, periods, kickoffs, midPeriod1, false).show).toBe("lineup");
    expect(rosterDisplay(2, periods, kickoffs, midPeriod1, false).show).toBe("squad");
  });

  // Fantrax serves next period's roster before that period opens; asked "what
  // period is this?", the clock says one thing and the payload says another. The
  // payload wins, because it describes the rows we are actually holding.
  it("judges the period the payload declared, not the period the clock is in", () => {
    expect(rosterDisplay(2, periods, kickoffs, "2026-08-25T12:00:00.000Z", false)).toEqual({
      show: "squad",
      because: "not-locked",
      period: 2,
    });
  });

  // The state behind the screenshot Craig sent: gameweek 1's football is
  // complete, Fantrax has rolled its own label to period 2, and period 2's lock
  // is still six hours away. The gate is right to withhold — period 2 is the
  // arrangement it is holding and nobody may see a rival's yet.
  //
  // What was wrong was the sentence. The route printed the round the READER was
  // looking at, so a page about gameweek 1 explained itself with "until lineups
  // lock for period 1" — a deadline that had passed a week earlier. The one
  // number a withheld panel prints has to be the one the decision was made
  // about, and that is knowable only here.
  it("names the period it judged, not the round the reader is looking at", () => {
    expect(rosterDisplay(2, periods, kickoffs, "2026-08-28T12:30:00.000Z", false)).toEqual({
      show: "squad",
      because: "not-locked",
      period: 2,
    });
  });

  // And only `not-locked` carries a period. These three fell back before any
  // lock was consulted, so there is none they could honestly name — which these
  // `toEqual`s prove by exhaustion, having always proved it.
  it("names which safety it fell back on", () => {
    expect(rosterDisplay(null, periods, kickoffs, P1_LOCKS, false)).toEqual({
      show: "squad",
      because: "unknown-period",
    });
    expect(rosterDisplay(1, [], kickoffs, P1_LOCKS, false)).toEqual({
      show: "squad",
      because: "no-calendar",
    });
    expect(rosterDisplay(99, periods, kickoffs, P1_LOCKS, false)).toEqual({
      show: "squad",
      because: "period-not-in-calendar",
    });
  });

  it("hides rather than guesses when the calendar is unreadable", () => {
    const broken: LeaguePeriod[] = [{ number: 1, start: "not a date", end: "not a date" }];
    expect(rosterDisplay(1, broken, kickoffs, P1_LOCKS, false).show).toBe("squad");
  });
});

// The reason this file was rewritten. Every one of these is a rival's
// arrangement, and every one of them was public before the change.
describe("the lock, and not the period boundary", () => {
  it("hides a rival's XI while the period is open and the lock is still ahead", () => {
    // Period 4 opens Fri 11 Sep 10:00Z for a round that starts Sat 12 Sep 14:00Z.
    // Twenty-seven and three quarter hours, on the boundary reading.
    expect(rosterDisplay(4, periods, kickoffs, "2026-09-11T10:00:00.000Z", false)).toEqual({
      show: "squad",
      because: "not-locked",
      period: 4,
    });
  });

  it("opens at the lock and not a millisecond before", () => {
    expect(rosterDisplay(4, periods, kickoffs, justBefore(P4_LOCKS), false).show).toBe("squad");
    expect(rosterDisplay(4, periods, kickoffs, P4_LOCKS, false)).toEqual({
      show: "lineup",
      period: 4,
    });
  });

  it("keeps period 6 shut from the moment it opens until Saturday's lock", () => {
    // The real league's first round, and the one that ships.
    expect(rosterDisplay(6, periods, kickoffs, "2026-10-09T10:00:00.000Z", false).show).toBe(
      "squad",
    );
    expect(rosterDisplay(6, periods, kickoffs, "2026-10-10T11:14:59.999Z", false).show).toBe(
      "squad",
    );
    expect(rosterDisplay(6, periods, kickoffs, "2026-10-10T11:15:00.000Z", false).show).toBe(
      "lineup",
    );
  });

  // The other direction, and the one somebody will "fix" back. On a Friday-night
  // week the lock falls fifteen minutes BEFORE the period's own boundary, and the
  // arrangement is public then — because it is locked, which is the only question
  // this gate asks.
  it("opens fifteen minutes before a Friday-night period begins", () => {
    expect(rosterDisplay(3, periods, kickoffs, "2026-09-04T18:45:00.000Z", false)).toEqual({
      show: "lineup",
      period: 3,
    });
  });

  it("says so when there is no lock to measure", () => {
    // An international break, or a round FPL has not dated.
    expect(rosterDisplay(4, periods, [], "2026-09-12T14:00:00.000Z", false)).toEqual({
      show: "squad",
      because: "unknown-lock",
    });
    // Football in the season, none of it inside this period.
    const elsewhere = kickoffs.filter((k) => k.gameweek !== 4);
    expect(rosterDisplay(4, periods, elsewhere, "2026-09-12T14:00:00.000Z", false).show).toBe(
      "squad",
    );
  });
});

describe("your own roster", () => {
  it("is visible all week, because hiding a man's team from himself protects nobody", () => {
    expect(rosterDisplay(1, periods, kickoffs, BEFORE_THE_SEASON, true)).toEqual({
      show: "lineup",
      period: 1,
    });
  });

  it("does not need a calendar, since no instant is being judged", () => {
    expect(rosterDisplay(1, [], [], BEFORE_THE_SEASON, true)).toEqual({
      show: "lineup",
      period: 1,
    });
  });

  it("still hides when Fantrax would not say which period the roster is", () => {
    expect(rosterDisplay(null, periods, kickoffs, BEFORE_THE_SEASON, true)).toEqual({
      show: "squad",
      because: "unknown-period",
    });
  });

  // THE PLANNER'S GUARANTEE. Friday morning, period 4 open, the lock a day away,
  // a full calendar in hand: a rival is shut and the reader is not. If this ever
  // fails, the short-circuit has been moved below the calendar checks and the one
  // thing the app can do with a lineup before a deadline has gone with it.
  it("is his own all week, at the very instant a rival's is withheld", () => {
    const friday = "2026-09-11T10:00:00.000Z";
    expect(rosterDisplay(4, periods, kickoffs, friday, true)).toEqual({
      show: "lineup",
      period: 4,
    });
    expect(rosterDisplay(4, periods, kickoffs, friday, false).show).toBe("squad");
    expect(rosterDisplay(4, periods, [], friday, true)).toEqual({ show: "lineup", period: 4 });
  });
});
