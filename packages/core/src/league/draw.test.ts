import { describe, expect, it } from "vitest";
import { drawFrom, seedsByPoints } from "./draw";
import type { PeriodResult } from "./fantrax/results";

const teams = [
  { teamId: "a", name: "Alpha" },
  { teamId: "b", name: "Bravo" },
  { teamId: "c", name: "Charlie" },
];
const result = (period: number, teamId: string, points: number | null): PeriodResult => ({
  period,
  teamId,
  points,
});

describe("seedsByPoints", () => {
  it("seeds the week's highest scorer first", () => {
    const results = [result(9, "a", 40), result(9, "b", 71.5), result(9, "c", 55)];
    expect([...seedsByPoints(teams, results, 9).values()].map((team) => team.teamId)).toEqual(["b", "c", "a"]);
  });

  it("splits a level week on the points each team has to date", () => {
    const results = [
      result(8, "a", 90), result(8, "b", 30), result(8, "c", 60),
      result(9, "a", 50), result(9, "b", 50), result(9, "c", 20),
      result(10, "b", 500),
    ];
    expect([...seedsByPoints(teams, results, 9).values()].map((team) => team.teamId)).toEqual(["a", "b", "c"]);
  });

  it("seeds nobody while a team has no total for the week", () => {
    expect(seedsByPoints(teams, [result(9, "a", 40), result(9, "b", null)], 9).size).toBe(0);
  });
});

describe("drawFrom", () => {
  const results = [result(9, "a", 40), result(9, "b", 60), result(9, "c", 50)];
  const cup = { id: "cup", name: "Cup", seededBy: { gameweek: 9 } };

  it("seeds a cup off its gameweek only once that gameweek is finished", () => {
    expect(drawFrom([], teams, results, () => undefined).seeds(cup).size).toBe(0);
    expect(drawFrom([], teams, results, (gw) => gw).seeds(cup).get(1)?.teamId).toBe("b");
  });

  it("answers a gameweek's totals through the period it was scored in", () => {
    const draw = drawFrom([], teams, results, (gw) => (gw === 12 ? 9 : undefined));
    expect(draw.totals(12)?.get("c")).toBe(50);
    expect(draw.totals(9)).toBeUndefined();
  });
});
