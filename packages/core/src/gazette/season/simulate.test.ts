import { describe, expect, it } from "vitest";
import { mulberry32, simulateSeason, type PeriodScore } from "./simulate";

const teams = ["a", "b", "c", "d"].map((teamId) => ({ teamId, name: teamId.toUpperCase() }));
/** A round robin played twice over periods 1 to 6. */
const matchups = [1, 2, 3, 4, 5, 6].flatMap((period) =>
  (period % 3 === 1 ? [["a", "b"], ["c", "d"]] : period % 3 === 2 ? [["a", "c"], ["b", "d"]] : [["a", "d"], ["b", "c"]]).map(([homeTeamId, awayTeamId]) => ({ period, homeTeamId, awayTeamId })),
);
const flat = (mean: number, sd: number) => new Map([1, 2, 3, 4, 5, 6].map((period): [number, PeriodScore] => [period, { mean, sd }]));

describe("simulateSeason", () => {
  it("places the stronger sides higher and gives every run a first and a last", () => {
    const scores = new Map([["a", flat(60, 8)], ["b", flat(55, 8)], ["c", flat(50, 8)], ["d", flat(40, 8)]]);
    const outcome = simulateSeason({ teams, matchups, scores, runs: 2000, seed: 7 });
    expect(outcome.map((each) => each.teamId)).toEqual(["a", "b", "c", "d"]);
    expect(outcome.reduce((sum, each) => sum + each.placed[0], 0)).toBe(2000);
    expect(outcome.reduce((sum, each) => sum + each.placed[3], 0)).toBe(2000);
    expect(outcome.reduce((sum, each) => sum + each.placed[0] + each.placed[1], 0)).toBe(4000);
    expect(outcome[0].meanPlace).toBeLessThan(outcome[1].meanPlace);
  });

  it("plays the same season from the same seed", () => {
    const scores = new Map(teams.map((team): [string, Map<number, PeriodScore>] => [team.teamId, flat(50, 12)]));
    const run = () => simulateSeason({ teams, matchups, scores, runs: 500, seed: 2026 });
    expect(run()).toEqual(run());
  });

  it("counts both games of a double header off one period score", () => {
    // A wins its one game on a big score; B wins both games of its double header on a small one.
    const schedule = [{ period: 1, homeTeamId: "a", awayTeamId: "b" }, { period: 2, homeTeamId: "b", awayTeamId: "c" }, { period: 2, homeTeamId: "c", awayTeamId: "b" }];
    const scores = new Map([
      ["a", new Map([[1, { mean: 100, sd: 0 }]])],
      ["b", new Map([[1, { mean: 50, sd: 0 }], [2, { mean: 20, sd: 0 }]])],
      ["c", new Map([[2, { mean: 10, sd: 0 }]])],
    ]);
    const outcome = simulateSeason({ teams: teams.slice(0, 3), matchups: schedule, scores, runs: 1, seed: 1 });
    expect(outcome.map((each) => each.teamId)).toEqual(["b", "a", "c"]);
  });

  it("gives nobody the win when two totals are level, as two sides with no reading are", () => {
    const outcome = simulateSeason({ teams: teams.slice(0, 2), matchups: [{ period: 1, homeTeamId: "a", awayTeamId: "b" }], scores: new Map(), runs: 100, seed: 1 });
    expect(outcome.map((each) => [each.teamId, each.meanPlace])).toEqual([["a", 1], ["b", 1]]);
  });

  it("breaks a level number of wins on fantasy points for", () => {
    // One win each; A scored 100 to B's 95.
    const two = [{ period: 1, homeTeamId: "b", awayTeamId: "a" }, { period: 2, homeTeamId: "a", awayTeamId: "b" }];
    const scores = new Map([
      ["a", new Map([[1, { mean: 40, sd: 0 }], [2, { mean: 60, sd: 0 }]])],
      ["b", new Map([[1, { mean: 45, sd: 0 }], [2, { mean: 50, sd: 0 }]])],
    ]);
    const outcome = simulateSeason({ teams: teams.slice(0, 2), matchups: two, scores, runs: 1, seed: 1 });
    expect(outcome.map((each) => [each.teamId, each.placed[0]])).toEqual([["a", 1], ["b", 0]]);
  });
});

describe("mulberry32", () => {
  it("draws on [0, 1) and repeats from its seed", () => {
    const [one, two] = [mulberry32(42), mulberry32(42)];
    const draws = Array.from({ length: 100 }, () => one());
    expect(draws.every((draw) => draw >= 0 && draw < 1)).toBe(true);
    expect(Array.from({ length: 100 }, () => two())).toEqual(draws);
  });
});
