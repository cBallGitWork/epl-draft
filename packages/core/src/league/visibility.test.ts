import { describe, expect, it } from "vitest";
import { lastLockedPeriod, periodToRead, planningPeriod, rosterDisplay } from "./visibility";
import type { GameweekKickoff } from "./calendar";
import type { LeaguePeriod } from "./types";

// Verbatim from data/snapshots/fantrax/leagues/ayyoh-abandoned/2026-08-27/getLeagueInfo.json.
// Periods 4 and 6 open on a Friday morning for a Saturday round, the weeks where boundary and lock differ.
const periods: LeaguePeriod[] = [
  { number: 1, start: "2026-08-21T15:00:00.0-0400", end: "2026-08-28T14:59:58.0-0400" },
  { number: 2, start: "2026-08-28T15:00:00.0-0400", end: "2026-09-04T14:59:58.0-0400" },
  { number: 3, start: "2026-09-04T15:00:00.0-0400", end: "2026-09-11T05:59:58.0-0400" },
  { number: 4, start: "2026-09-11T06:00:00.0-0400", end: "2026-09-18T14:59:58.0-0400" },
  { number: 6, start: "2026-10-09T06:00:00.0-0400", end: "2026-10-16T05:59:58.0-0400" },
];

// Declared here, never read from FPL: this tests the rule, and FPL moves rounds for television.
const kickoffs: GameweekKickoff[] = [
  { gameweek: 1, kickoff: "2026-08-21T19:00:00Z" },
  { gameweek: 2, kickoff: "2026-08-28T19:00:00Z" },
  { gameweek: 3, kickoff: "2026-09-04T19:00:00Z" },
  { gameweek: 4, kickoff: "2026-09-12T14:00:00Z" },
  { gameweek: 6, kickoff: "2026-10-10T11:30:00Z" },
];

/** Fifteen minutes before each period's first ball — what the masthead prints. */
const P1_LOCKS = "2026-08-21T18:45:00.000Z";
const P2_LOCKS = "2026-08-28T18:45:00.000Z";
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

  // As strings, a 15:00-0400 start (19:00Z) sorts before 18:00Z; `firstKickoff` must compare instants.
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

  // Gameweek 1 done, Fantrax's label rolled to period 2 and its lock six hours off: the withheld panel must name
  // period 2, the period judged, never the round the reader is looking at.
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

  // On a Friday-night week the lock falls before the period's own boundary, and the lineup is public from the lock.
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

  // Friday morning, the lock a day away: a rival is shut and the reader is not. A failure here means the reader's
  // short-circuit has moved below the calendar checks.
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

// Which week the squad screens are about, which mid-round is not the week
// Fantrax hands over unasked.
describe("planningPeriod", () => {
  it("names the week whose lineups are still open", () => {
    // Before a ball is kicked, that is the first period.
    expect(planningPeriod(periods, kickoffs, BEFORE_THE_SEASON)).toBe(1);
  });

  // Mid-round Fantrax still serves the live period, which nobody can change; planning moves on at the lock.
  it("moves on the moment this week locks, not when the round ends", () => {
    expect(planningPeriod(periods, kickoffs, justBefore(P2_LOCKS))).toBe(2);
    expect(planningPeriod(periods, kickoffs, P2_LOCKS)).toBe(3);
    // Still 3 in the middle of the weekend, which is where the bug was seen.
    expect(planningPeriod(periods, kickoffs, "2026-08-29T13:53:00.000Z")).toBe(3);
  });

  it("steps over a week it cannot find a lock in rather than calling it open", () => {
    // Period 5 is in the fixture's gap: no kickoffs, so no lock to measure.
    // Answering 5 would point the squad screens at a week with no football in it.
    const blank = [...periods, { number: 5, start: "2026-09-18T15:00:00.0-0400", end: "2026-10-09T05:59:58.0-0400" }];
    expect(planningPeriod(blank, kickoffs, "2026-09-19T12:00:00.000Z")).toBe(6);
  });

  it("says nothing when every week has locked, or when there is no calendar", () => {
    expect(planningPeriod(periods, kickoffs, "2027-06-01T12:00:00.000Z")).toBeNull();
    expect(planningPeriod([], kickoffs, BEFORE_THE_SEASON)).toBeNull();
  });
});

// The other end of the same question. `planningPeriod` is the week you can still
// change; this is the last week anybody may SEE — and a rival's squad screen
// wants the second, because the first is precisely the week the gate withholds.
describe("lastLockedPeriod", () => {
  it("says nothing before the season's first lock", () => {
    // Nobody has arranged anything yet, and the caller falls back to the
    // planning week because that is all there is to show.
    expect(lastLockedPeriod(periods, kickoffs, BEFORE_THE_SEASON)).toBeNull();
  });

  it("turns over at the lock, not at the round's end", () => {
    expect(lastLockedPeriod(periods, kickoffs, justBefore(P2_LOCKS))).toBe(1);
    expect(lastLockedPeriod(periods, kickoffs, P2_LOCKS)).toBe(2);
  });

  it("is the LIVE week mid-round, which is what a reader wants on a Saturday", () => {
    // The same instant `planningPeriod` answers 3 for: the week being played has
    // locked, so it is both the last locked one and the one with football in it.
    const midWeekend = "2026-08-29T13:53:00.000Z";
    expect(planningPeriod(periods, kickoffs, midWeekend)).toBe(3);
    expect(lastLockedPeriod(periods, kickoffs, midWeekend)).toBe(2);
  });

  it("holds the last week of the season once every week has locked", () => {
    // Where `planningPeriod` runs out and answers null, this still has an answer
    // — the season's arrangements do not stop being visible when it ends.
    expect(planningPeriod(periods, kickoffs, "2027-06-01T12:00:00.000Z")).toBeNull();
    expect(lastLockedPeriod(periods, kickoffs, "2027-06-01T12:00:00.000Z")).not.toBeNull();
  });

  it("never counts a week it cannot find a lock in", () => {
    // Unknown is not locked, on the same rule `planningPeriod` reads it by.
    expect(lastLockedPeriod([], kickoffs, "2027-06-01T12:00:00.000Z")).toBeNull();
  });
});

// Which payload to ask Fantrax for. The gate above decides what to do with one;
// this decides which one to fetch, and it is the same safety question one step
// earlier.
describe("periodToRead", () => {
  // Gameweek 1 played out, Fantrax's label already on 2, period 1 locked a week earlier.
  it("names a past period once the label has moved past it and its lock has gone", () => {
    expect(periodToRead(1, 2, periods, kickoffs, "2026-08-28T12:30:00.000Z")).toBe(1);
  });

  it("asks for nothing when the round in view is the period Fantrax has open", () => {
    expect(periodToRead(2, 2, periods, kickoffs, "2026-08-28T12:30:00.000Z")).toBeNull();
  });

  // A round ahead of Fantrax's label is asked for outright — it is the week the
  // squad screens are about, and it leaks nothing: the gate withholds an
  // unlocked arrangement from everyone but its own manager.
  it("asks for a round that has not happened yet", () => {
    expect(periodToRead(4, 2, periods, kickoffs, "2026-08-28T12:30:00.000Z")).toBe(4);
    expect(rosterDisplay(4, periods, kickoffs, "2026-08-28T12:30:00.000Z", false)).toEqual({
      show: "squad",
      because: "not-locked",
      period: 4,
    });
  });

  // Fantrax's label can leave period 4 before period 4 has locked; our calendar says open, so we do not read it.
  it("refuses a period the label has left but our own calendar has not locked", () => {
    expect(periodToRead(4, 5, periods, kickoffs, "2026-09-11T10:00:00.000Z")).toBeNull();
    // And takes it the moment the lock actually lands.
    expect(periodToRead(4, 5, periods, kickoffs, P4_LOCKS)).toBe(4);
  });

  it("asks for nothing without a calendar, or without a label to compare", () => {
    expect(periodToRead(1, 2, [], kickoffs, "2026-08-28T12:30:00.000Z")).toBeNull();
    expect(periodToRead(1, null, periods, kickoffs, "2026-08-28T12:30:00.000Z")).toBeNull();
    expect(periodToRead(null, 2, periods, kickoffs, "2026-08-28T12:30:00.000Z")).toBeNull();
    // A period the calendar does not carry is one we cannot find a lock for.
    expect(periodToRead(5, 6, periods, kickoffs, "2026-10-10T12:00:00.000Z")).toBeNull();
  });
});
