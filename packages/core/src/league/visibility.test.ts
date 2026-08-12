import { describe, expect, it } from "vitest";
import {
  latestStartedPeriod,
  lineupVisible,
  periodAt,
  periodStarted,
  rosterDisplay,
} from "./visibility";
import type { LeaguePeriod } from "./types";

// Instants copied verbatim from the 12 Aug 2026 capture. Period 1 opens at
// 2026-08-21T15:00:00.0-0400 — 20:00 UK on the day GW1 kicks off — and every
// period ends one second before the next begins.
const periods: LeaguePeriod[] = [
  { number: 1, start: "2026-08-21T15:00:00.0-0400", end: "2026-08-28T14:59:58.0-0400" },
  { number: 2, start: "2026-08-28T15:00:00.0-0400", end: "2026-09-04T14:59:58.0-0400" },
  { number: 3, start: "2026-09-04T15:00:00.0-0400", end: "2026-09-11T14:59:58.0-0400" },
];

/** Period 1's start expressed as the UTC instant our own code would send. */
const PERIOD_1_START = "2026-08-21T19:00:00.000Z";
const BEFORE_THE_SEASON = "2026-08-12T12:00:00.000Z";

describe("periodStarted", () => {
  it("is true at the very instant the period opens", () => {
    expect(periodStarted(periods[0], PERIOD_1_START)).toBe(true);
  });

  it("is false one millisecond earlier", () => {
    expect(periodStarted(periods[0], "2026-08-21T18:59:59.999Z")).toBe(false);
  });

  // THE TRAP. Fantrax sends -0400 and we send Z, so the two sides of every
  // comparison are in different notations. Lexically "…T15:00:00.0-0400" sorts
  // BELOW "…T18:00:00.000Z" while the instants run the other way: 19:00Z
  // against 18:00Z. A string comparison would call the period open a full hour
  // early — and would agree with the correct answer at every other moment of
  // the week, which is what lets it survive a careless test.
  it("compares instants, not strings — 18:00Z is BEFORE a 15:00-0400 start", () => {
    const anHourBefore = "2026-08-21T18:00:00.000Z";

    // What a string comparison would conclude, demonstrated rather than asserted
    // about, so this test fails loudly if anyone "simplifies" the implementation.
    expect(periods[0].start < anHourBefore).toBe(true);

    // What is actually true.
    expect(periodStarted(periods[0], anHourBefore)).toBe(false);
  });

  it("returns null rather than false when a date cannot be read", () => {
    // Null forces the caller to decide. False would be indistinguishable from
    // "not started yet", which is how an unparseable calendar becomes a lineup
    // that never appears and nobody can explain.
    expect(periodStarted({ number: 1, start: "not a date", end: "" }, PERIOD_1_START)).toBeNull();
    expect(periodStarted(periods[0], "not a date")).toBeNull();
  });
});

describe("periodAt", () => {
  it("finds the period containing the instant", () => {
    expect(periodAt(periods, "2026-08-25T12:00:00.000Z")?.number).toBe(1);
    expect(periodAt(periods, "2026-09-01T12:00:00.000Z")?.number).toBe(2);
  });

  it("is null before the season opens", () => {
    expect(periodAt(periods, BEFORE_THE_SEASON)).toBeNull();
  });

  it("holds the boundary second against exactly one period", () => {
    // Period 1 ends 14:59:58-0400 and period 2 opens 15:00:00-0400, so the
    // second between them belongs to neither. That gap is Fantrax's, not ours,
    // and inventing an owner for it would be inventing league state.
    const inTheGap = "2026-08-28T18:59:59.000Z";
    expect(periodAt(periods, inTheGap)).toBeNull();

    expect(periodAt(periods, "2026-08-28T18:59:58.000Z")?.number).toBe(1);
    expect(periodAt(periods, "2026-08-28T19:00:00.000Z")?.number).toBe(2);
  });
});

describe("latestStartedPeriod", () => {
  it("is null before the season opens", () => {
    expect(latestStartedPeriod(periods, BEFORE_THE_SEASON)).toBeNull();
  });

  it("keeps the most recent period once one has begun", () => {
    expect(latestStartedPeriod(periods, "2026-09-01T12:00:00.000Z")?.number).toBe(2);
  });

  it("picks by period number, not array order", () => {
    // Fantrax sorts nothing it sends us.
    const shuffled = [periods[2], periods[0], periods[1]];
    expect(latestStartedPeriod(shuffled, "2026-09-08T12:00:00.000Z")?.number).toBe(3);
  });
});

describe("lineupVisible", () => {
  it("hides every lineup before the period starts", () => {
    expect(lineupVisible(periods, 1, BEFORE_THE_SEASON)).toBe(false);
  });

  it("reveals the lineup once the period is running", () => {
    expect(lineupVisible(periods, 1, PERIOD_1_START)).toBe(true);
  });

  it("still hides a LATER period while an earlier one is running", () => {
    // The whole point of the gate: on Tuesday of gameweek 1, this week's XI is
    // public and next week's is not.
    const midPeriod1 = "2026-08-25T12:00:00.000Z";
    expect(lineupVisible(periods, 1, midPeriod1)).toBe(true);
    expect(lineupVisible(periods, 2, midPeriod1)).toBe(false);
  });

  it("hides what it cannot find", () => {
    expect(lineupVisible(periods, 99, PERIOD_1_START)).toBe(false);
    expect(lineupVisible([], 1, PERIOD_1_START)).toBe(false);
  });
});

describe("rosterDisplay", () => {
  it("shows the lineup for a period that has started", () => {
    expect(rosterDisplay(1, periods, PERIOD_1_START)).toEqual({ show: "lineup", period: 1 });
  });

  it("falls back to the squad, and names which safety it fell back on", () => {
    expect(rosterDisplay(1, periods, BEFORE_THE_SEASON)).toEqual({
      show: "squad",
      because: "not-started",
    });
    expect(rosterDisplay(null, periods, PERIOD_1_START)).toEqual({
      show: "squad",
      because: "unknown-period",
    });
    expect(rosterDisplay(1, [], PERIOD_1_START)).toEqual({
      show: "squad",
      because: "no-calendar",
    });
    expect(rosterDisplay(99, periods, PERIOD_1_START)).toEqual({
      show: "squad",
      because: "period-not-in-calendar",
    });
  });

  it("hides rather than guesses when the calendar is unreadable", () => {
    const broken: LeaguePeriod[] = [{ number: 1, start: "not a date", end: "not a date" }];
    expect(rosterDisplay(1, broken, PERIOD_1_START)).toEqual({
      show: "squad",
      because: "not-started",
    });
  });

  // Where this gate earns its place. Fantrax will serve next period's roster
  // before that period opens; asked "what period is this?", the clock says one
  // thing and the payload says another. The payload wins, because it describes
  // the rows we are actually holding.
  it("judges the period the payload declared, not the period the clock is in", () => {
    const duringPeriod1 = "2026-08-25T12:00:00.000Z";
    expect(rosterDisplay(2, periods, duringPeriod1)).toEqual({
      show: "squad",
      because: "not-started",
    });
  });

  it("hides all four squads today, which is the state the league is actually in", () => {
    // 12 Aug 2026: nothing has started, so nothing is revealed. This is the
    // assertion that will change on 21 Aug and nowhere else.
    expect(rosterDisplay(1, periods, "2026-08-12T12:00:00.000Z").show).toBe("squad");
  });
});
