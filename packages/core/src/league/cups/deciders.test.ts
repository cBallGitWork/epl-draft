import { describe, expect, it } from "vitest";
import type { PeriodResult } from "../fantrax/results";
import { seedByPoints } from "./seeding";
import { knockoutWinner, type TieTotals } from "./tieBreak";

const totals = (overrides: Partial<TieTotals> = {}): TieTotals => ({
  points: 60,
  goals: 2,
  assists: 3,
  cleanSheets: 1,
  minutes: 900,
  ...overrides,
});

describe("knockoutWinner", () => {
  it("goes on points first", () => {
    expect(knockoutWinner(totals({ points: 61, goals: 0 }), totals())).toBe("home");
  });

  it("falls to goals, then assists, clean sheets and minutes, in that order", () => {
    expect(knockoutWinner(totals({ goals: 1, assists: 9 }), totals())).toBe("away");
    expect(knockoutWinner(totals({ assists: 4, cleanSheets: 0 }), totals())).toBe("home");
    expect(knockoutWinner(totals({ cleanSheets: 0 }), totals())).toBe("away");
    expect(knockoutWinner(totals(), totals({ minutes: 899 }))).toBe("home");
  });

  it("says level when every decider is equal", () => {
    expect(knockoutWinner(totals(), totals())).toBe("level");
  });

  it("will not decide on a figure it has not read", () => {
    expect(knockoutWinner(totals(), totals({ points: null }))).toBeNull();
    expect(knockoutWinner(totals({ assists: null }), totals())).toBeNull();
    // A decider below the one that settles it may be missing.
    expect(knockoutWinner(totals({ goals: 3, minutes: null }), totals())).toBe("home");
  });
});

describe("seedByPoints", () => {
  const scored = (teamId: string, points: number | null, period = 9): PeriodResult => ({ period, teamId, points });

  it("seeds the gameweek's highest scorer first, and reads only that gameweek", () => {
    const results = [scored("a", 40), scored("b", 70), scored("c", 55), scored("a", 99, 8)];
    expect(seedByPoints(["a", "b", "c"], results, 9)).toEqual(["b", "c", "a"]);
  });

  it("keeps the order it was given for a tie, and puts the unscored last", () => {
    const results = [scored("a", 50), scored("b", 50), scored("c", null)];
    expect(seedByPoints(["c", "b", "a", "d"], results, 9)).toEqual(["b", "a", "c", "d"]);
  });
});
