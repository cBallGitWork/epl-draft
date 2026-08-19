import { describe, expect, it } from "vitest";
import { rosterDisplay } from "./visibility";
import type { LeaguePeriod } from "./types";

// Instants copied verbatim from the 12 Aug 2026 capture. Period 1 opens at
// 2026-08-21T15:00:00.0-0400 — 20:00 UK on the day GW1 kicks off — and every
// period ends one second before the next begins.
const periods: LeaguePeriod[] = [
  { number: 1, start: "2026-08-21T15:00:00.0-0400", end: "2026-08-28T14:59:58.0-0400" },
  { number: 2, start: "2026-08-28T15:00:00.0-0400", end: "2026-09-04T14:59:58.0-0400" },
];

/** The same instants the periods above carry, in the notation our own code
 *  sends. Derived rather than written out again: two spellings of one moment,
 *  kept in step by hand, is the bug this module exists to prevent. */
const asUtc = (iso: string, shiftMs = 0) => new Date(Date.parse(iso) + shiftMs).toISOString();
const PERIOD_1_OPENS = asUtc(periods[0].start);
const BEFORE_THE_SEASON = "2026-08-12T12:00:00.000Z";

describe("rosterDisplay", () => {
  it("hides every lineup before the period starts", () => {
    expect(rosterDisplay(1, periods, BEFORE_THE_SEASON, false)).toEqual({
      show: "squad",
      because: "not-started",
    });
  });

  it("reveals the lineup at the very instant the period opens", () => {
    expect(rosterDisplay(1, periods, PERIOD_1_OPENS, false)).toEqual({ show: "lineup", period: 1 });
  });

  it("is still hiding it one millisecond earlier", () => {
    expect(rosterDisplay(1, periods, asUtc(periods[0].start, -1), false).show).toBe("squad");
  });

  // THE TRAP. Fantrax sends -0400 and we send Z, so the two sides of every
  // comparison are in different notations. Lexically "…T15:00:00.0-0400" sorts
  // BELOW "…T18:00:00.000Z" while the instants run the other way: 19:00Z against
  // 18:00Z. A string comparison would open the gate a full hour early — and
  // would agree with the correct answer at every other moment of the week, which
  // is what lets it survive a careless test.
  it("compares instants, not strings — 18:00Z is BEFORE a 15:00-0400 start", () => {
    const anHourBefore = "2026-08-21T18:00:00.000Z";

    // What a string comparison concludes, demonstrated rather than described, so
    // this fails loudly if anyone "simplifies" the implementation.
    expect(periods[0].start < anHourBefore).toBe(true);

    expect(rosterDisplay(1, periods, anHourBefore, false).show).toBe("squad");
  });

  it("still hides a LATER period while an earlier one is running", () => {
    // On Tuesday of gameweek 1, this week's XI is public and next week's is not.
    const midPeriod1 = "2026-08-25T12:00:00.000Z";
    expect(rosterDisplay(1, periods, midPeriod1, false).show).toBe("lineup");
    expect(rosterDisplay(2, periods, midPeriod1, false).show).toBe("squad");
  });

  // Where the gate earns its place. Fantrax serves next period's roster before
  // that period opens; asked "what period is this?", the clock says one thing and
  // the payload says another. The payload wins, because it describes the rows we
  // are actually holding.
  it("judges the period the payload declared, not the period the clock is in", () => {
    expect(rosterDisplay(2, periods, "2026-08-25T12:00:00.000Z", false)).toEqual({
      show: "squad",
      because: "not-started",
    });
  });

  it("names which safety it fell back on", () => {
    expect(rosterDisplay(null, periods, PERIOD_1_OPENS, false)).toEqual({
      show: "squad",
      because: "unknown-period",
    });
    expect(rosterDisplay(1, [], PERIOD_1_OPENS, false)).toEqual({
      show: "squad",
      because: "no-calendar",
    });
    expect(rosterDisplay(99, periods, PERIOD_1_OPENS, false)).toEqual({
      show: "squad",
      because: "period-not-in-calendar",
    });
  });

  it("hides rather than guesses when the calendar is unreadable", () => {
    const broken: LeaguePeriod[] = [{ number: 1, start: "not a date", end: "not a date" }];
    expect(rosterDisplay(1, broken, PERIOD_1_OPENS, false).show).toBe("squad");
  });

  it("hides all four squads today, which is the state the league is in", () => {
    // This is the assertion that changes on 21 Aug and nowhere else.
    expect(rosterDisplay(1, periods, BEFORE_THE_SEASON, false).show).toBe("squad");
  });
});

describe("your own roster", () => {
  it("is visible all week, because hiding a man's team from himself protects nobody", () => {
    expect(rosterDisplay(1, periods, BEFORE_THE_SEASON, true)).toEqual({
      show: "lineup",
      period: 1,
    });
  });

  it("does not need a calendar, since no instant is being judged", () => {
    expect(rosterDisplay(1, [], BEFORE_THE_SEASON, true)).toEqual({ show: "lineup", period: 1 });
  });

  it("still hides when Fantrax would not say which period the roster is", () => {
    // `show: "lineup"` has to name the period it is showing, and a guess there
    // would put last week's XI under this week's heading.
    expect(rosterDisplay(null, periods, BEFORE_THE_SEASON, true)).toEqual({
      show: "squad",
      because: "unknown-period",
    });
  });

  it("changes nothing for anybody else at the same instant", () => {
    expect(rosterDisplay(1, periods, BEFORE_THE_SEASON, false).show).toBe("squad");
  });
});
