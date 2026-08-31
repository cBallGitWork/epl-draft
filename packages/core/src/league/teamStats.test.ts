import { describe, expect, it } from "vitest";
import { teamPeriodStats } from "./teamStats";
import type { PeriodResult } from "./fantrax/results";

const result = (period: number, teamId: string, points: number | null): PeriodResult => ({
  period,
  teamId,
  points,
});

describe("teamPeriodStats", () => {
  // Two sides on the same total and nothing else in common: the league table
  // cannot separate them and this is the whole reason the screen exists.
  const RESULTS: PeriodResult[] = [
    result(1, "steady", 60),
    result(2, "steady", 60),
    result(3, "steady", 60),
    result(1, "swingy", 90),
    result(2, "swingy", 30),
    result(3, "swingy", 60),
  ];
  const PLAYED = new Set([1, 2, 3]);

  it("separates two teams a total cannot", () => {
    const [steady, swingy] = teamPeriodStats(RESULTS, PLAYED);
    expect(steady).toMatchObject({ scored: 3, high: 60, low: 60, average: 60 });
    expect(swingy).toMatchObject({ scored: 3, high: 90, low: 30, average: 60 });
  });

  // Fantrax answers for any period asked, so the unplayed thirty-odd are in the
  // payload as noughts. Averaging those in halves everyone's form.
  it("counts only the periods it is given", () => {
    const withFuture = [...RESULTS, result(4, "steady", 0), result(5, "steady", 0)];
    expect(teamPeriodStats(withFuture, PLAYED)[0]).toMatchObject({ scored: 3, average: 60 });
  });

  // Absence is not a nought, and it is not a game played either: a round Fantrax
  // scored as blank cannot be described, so it does not enter the divisor.
  it("skips a period with no readable total rather than scoring it nought", () => {
    const blank = [result(1, "a", 40), result(2, "a", null), result(3, "a", 60)];
    expect(teamPeriodStats(blank, PLAYED)[0]).toMatchObject({
      scored: 2,
      high: 60,
      low: 40,
      average: 50,
    });
  });

  it("has nothing to say about a team with no readable total", () => {
    expect(teamPeriodStats([result(1, "a", null)], PLAYED)).toEqual([]);
  });

  it("is empty before a round is scored", () => {
    expect(teamPeriodStats([], PLAYED)).toEqual([]);
    expect(teamPeriodStats(RESULTS, new Set())).toEqual([]);
  });

  // Unrounded on purpose: 59.5 and 60 are the same fact at two precisions and
  // the view chooses which. Rounding here would make the number un-averageable.
  it("leaves the mean unrounded", () => {
    expect(teamPeriodStats([result(1, "a", 40), result(2, "a", 41)], PLAYED)[0]?.average).toBe(40.5);
  });
});
