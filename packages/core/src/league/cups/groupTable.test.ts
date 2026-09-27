import { describe, expect, it } from "vitest";
import { groupQualifiers, groupTable, type CupResult } from "./groupTable";
import { roundRobin } from "./roundRobin";

const POINTS = { won: 3, drawn: 1 };

const result = (home: string, away: string, homePoints: number | null, awayPoints: number | null): CupResult => ({
  home,
  away,
  homePoints,
  awayPoints,
});

describe("roundRobin", () => {
  it("meets every pair once in a group of five, one team sitting out each round", () => {
    const rounds = roundRobin(["a", "b", "c", "d", "e"]);
    expect(rounds).toHaveLength(5);
    for (const round of rounds) expect(round).toHaveLength(2);

    const met = rounds.flat().map((pairing) => [...pairing].sort().join(""));
    expect(new Set(met).size).toBe(10);
    expect(met).toHaveLength(10);
  });

  it("gives an even group a full round every week", () => {
    const rounds = roundRobin(["a", "b", "c", "d"]);
    expect(rounds).toHaveLength(3);
    for (const round of rounds) expect(new Set(round.flat()).size).toBe(4);
  });

  it("draws nothing for a group too small to play", () => {
    expect(roundRobin(["a"])).toEqual([]);
  });
});

describe("groupTable", () => {
  it("places by points, then points for", () => {
    const table = groupTable(
      ["a", "b", "c"],
      [result("a", "b", 50, 40), result("b", "c", 60, 30), result("c", "a", 45, 45)],
      POINTS,
    );
    expect(table.map((row) => row.teamId)).toEqual(["a", "b", "c"]);
    expect(table[0]).toMatchObject({ played: 2, won: 1, drawn: 1, points: 4, pointsFor: 95 });
    expect(table[1]).toMatchObject({ won: 1, lost: 1, points: 3, pointsFor: 100 });
  });

  it("counts nothing Fantrax has not scored", () => {
    const [row] = groupTable(["a", "b"], [result("a", "b", 50, null)], POINTS);
    expect(row).toMatchObject({ teamId: "a", played: 0, points: 0 });
  });

  it("falls back to draw order when two are level on everything", () => {
    expect(groupTable(["b", "a"], [], POINTS).map((row) => row.teamId)).toEqual(["b", "a"]);
  });
});

describe("groupQualifiers", () => {
  it("seeds every winner, then every runner-up, down to the cut", () => {
    const table = (...teamIds: string[]) => groupTable(teamIds, [], POINTS);
    expect(groupQualifiers([table("a1", "a2", "a3", "a4"), table("b1", "b2", "b3", "b4")], 3)).toEqual([
      "a1",
      "b1",
      "a2",
      "b2",
      "a3",
      "b3",
    ]);
  });
});
