import { describe, expect, it } from "vitest";
import { periodGameweeks } from "./calendar";
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

  // THE TRAP, and the reason this test exists at all: `deadline_time` is the
  // first field anyone reaches for, because it is the one that reads like
  // "the gameweek starts here". Measured that way the same data says the two
  // calendars disagree everywhere. Fantrax's boundary sits in the 90-minute gap
  // between FPL's deadline and the gameweek's first kickoff, so each deadline
  // lands one period early.
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
