import { describe, expect, it } from "vitest";
import { firstKickoff, periodDays, periodGameweeks, saveOpen } from "./calendar";
import type { GameweekKickoff } from "./calendar";
import type { LeaguePeriod } from "./types";
import alignment from "./__fixtures__/periodAlignment.json";

// The fixture is the whole 26/27 season, recorded 6 Aug 2026: the rehearsal
// league's 38 scoring periods, all 380 fixture kickoffs, and — so the trap below
// can be demonstrated rather than described — FPL's 38 deadlines.

const periods = alignment.periods as LeaguePeriod[];
const kickoffs = alignment.kickoffs as GameweekKickoff[];
const deadlines = alignment.deadlines as GameweekKickoff[];

describe("periodGameweeks", () => {
  it("puts each gameweek in the identically numbered period, all 38 of them", () => {
    const aligned = periodGameweeks(periods, kickoffs);
    expect(aligned).toHaveLength(38);
    for (const { period, gameweeks } of aligned) {
      expect(gameweeks).toEqual([period]);
    }
  });

  it("accounts for every one of the 380 fixtures", () => {
    // A period boundary that quietly swallowed fixtures would still produce
    // one-gameweek-per-period above.
    expect(kickoffs).toHaveLength(380);
    const counted = periodGameweeks(periods, kickoffs).flatMap((p) => p.gameweeks);
    expect(new Set(counted).size).toBe(38);
  });

  // Fantrax's boundary sits between FPL's deadline and the first kickoff, so `deadline_time` lands a period early.
  it("does NOT align when measured by FPL's deadline, which is why kickoff is the key", () => {
    const byDeadline = periodGameweeks(periods, deadlines);

    // Systematically off by one: period 1 holds gameweek 2's deadline.
    expect(byDeadline.find((p) => p.period === 1)?.gameweeks).toEqual([2]);
    expect(byDeadline.find((p) => p.period === 2)?.gameweeks).toEqual([3]);

    // And two periods where it does not even fail consistently — the gap around
    // the September international break swallows one deadline and doubles up
    // another.
    expect(byDeadline.filter((p) => p.gameweeks.length !== 1).map((p) => p.period)).toEqual([
      3, 4, 5,
    ]);
    expect(byDeadline.find((p) => p.period === 3)?.gameweeks).toEqual([]);
    expect(byDeadline.find((p) => p.period === 4)?.gameweeks).toEqual([4, 5]);
  });

  it("compares instants, not strings", () => {
    // Fantrax bounds carry -0400 and FPL carries Z. "…T15:00:00.0-0400" sorts
    // before "…T19:00:00Z" lexically while being the very same moment, so a
    // string comparison would drop the first kickoff of every period.
    const period: LeaguePeriod[] = [
      { number: 1, start: "2026-08-21T15:00:00.0-0400", end: "2026-08-28T14:59:59.0-0400" },
    ];
    const atTheBound: GameweekKickoff[] = [{ gameweek: 1, kickoff: "2026-08-21T19:00:00Z" }];
    expect(periodGameweeks(period, atTheBound)).toEqual([{ period: 1, gameweeks: [1] }]);
  });

  it("degrades to nothing rather than throwing", () => {
    expect(periodGameweeks([], [])).toEqual([]);
    expect(periodGameweeks(periods, [])).toHaveLength(38);
    expect(periodGameweeks(periods, []).every((p) => p.gameweeks.length === 0)).toBe(true);
  });
});

// Real periods and kickoffs: only a Friday-morning open for a Saturday round (period 4) tells kickoff from boundary.

const period = (number: number, start: string, end: string): LeaguePeriod => ({
  number,
  start,
  end,
});

/** Periods 3 and 4 as Fantrax states them, and the rounds as FPL dates them. */
const P3 = period(3, "2026-09-04T15:00:00.0-0400", "2026-09-11T05:59:59.0-0400");
const P4 = period(4, "2026-09-11T06:00:00.0-0400", "2026-09-18T05:59:59.0-0400");

const KICKOFFS: GameweekKickoff[] = [
  // Gameweek 3 opens the period: a Friday night match.
  { gameweek: 3, kickoff: "2026-09-04T19:00:00Z" },
  { gameweek: 3, kickoff: "2026-09-05T14:00:00Z" },
  // Gameweek 4 has no Friday match, so its period opens a day before its football.
  { gameweek: 4, kickoff: "2026-09-12T14:00:00Z" },
  { gameweek: 4, kickoff: "2026-09-13T15:30:00Z" },
];

describe("firstKickoff", () => {
  it("finds the first ball kicked inside the period", () => {
    expect(firstKickoff(P4, KICKOFFS)).toBe("2026-09-12T14:00:00Z");
  });

  it("compares instants, not strings", () => {
    // The league's bounds carry -0400 and FPL's carry Z. Lexically
    // "2026-09-04T15" sorts before "2026-09-04T19Z" while being four hours later.
    expect(firstKickoff(P3, KICKOFFS)).toBe("2026-09-04T19:00:00Z");
  });

  it("says nothing for a period with no football in it", () => {
    expect(firstKickoff(P3, [])).toBeNull();
  });
});

describe("saveOpen", () => {
  const locks = "2026-10-10T11:15:00.000Z";

  it("takes a save until the margin before the lock", () => {
    expect(saveOpen(locks, "2026-10-10T11:04:59.000Z")).toBe(true);
  });

  it("refuses inside the margin and after the lock, so a live week is never written", () => {
    expect(saveOpen(locks, "2026-10-10T11:05:00.000Z")).toBe(false);
    expect(saveOpen(locks, "2026-10-10T12:00:00.000Z")).toBe(false);
  });

  it("refuses a week with no lock to measure", () => {
    expect(saveOpen(null, "2026-10-01T00:00:00.000Z")).toBe(false);
  });
});

describe("periodDays", () => {
  const days = (start: string, end: string) => periodDays({ number: 0, start, end });

  it("ends the day before a boundary that falls mid-afternoon, as Fantrax labels the period", () => {
    // Rehearsal, 30 Sep 2026: "4 (Sep 11 - Sep 17)" and "5 (Sep 18 - Oct 8)".
    expect(days("2026-09-11T06:00:00.0-0400", "2026-09-18T14:59:59.0-0400")).toEqual({ startDate: "2026-09-11", endDate: "2026-09-17" });
    expect(days("2026-09-18T15:00:00.0-0400", "2026-10-09T05:59:59.0-0400")).toEqual({ startDate: "2026-09-18", endDate: "2026-10-08" });
  });

  it("keeps the end day when the period runs to its last second, and crosses a month", () => {
    expect(days("2026-10-25T00:00:00-0400", "2026-10-31T23:59:59-0400")).toEqual({ startDate: "2026-10-25", endDate: "2026-10-31" });
    expect(days("2026-11-27T06:00:00.0-0500", "2026-12-01T05:59:59.0-0500").endDate).toBe("2026-11-30");
  });
});
