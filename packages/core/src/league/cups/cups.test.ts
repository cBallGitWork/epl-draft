import { describe, expect, it } from "vitest";
import { seededBracket } from "./bracket";
import { CUPS } from "./declared";
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

describe("seededBracket", () => {
  it("gives six entrants two byes and keeps 1 and 2 apart until the final", () => {
    expect(seededBracket(6)).toEqual([
      [
        [{ seed: 4 }, { seed: 5 }],
        [{ seed: 3 }, { seed: 6 }],
      ],
      [
        [{ seed: 1 }, { winnerOf: 0 }],
        [{ seed: 2 }, { winnerOf: 1 }],
      ],
      [[{ winnerOf: 0 }, { winnerOf: 1 }]],
    ]);
  });

  it("gives five entrants three byes and one opening tie", () => {
    const [opening, semis, final] = seededBracket(5);
    expect(opening).toEqual([[{ seed: 4 }, { seed: 5 }]]);
    expect(semis).toEqual([
      [{ seed: 1 }, { winnerOf: 0 }],
      [{ seed: 2 }, { seed: 3 }],
    ]);
    expect(final).toHaveLength(1);
  });

  it("plays a power of two out with no byes", () => {
    expect(seededBracket(8).map((round) => round.length)).toEqual([4, 2, 1]);
  });

  it("has no ties for fewer than two", () => {
    expect(seededBracket(1)).toEqual([]);
  });
});

describe("cup 2", () => {
  const cup = CUPS.find((declared) => declared.id === "cup-2");
  const stage = cup?.groupStage;

  it("is two groups whose top three go through and whose winners skip the quarter-finals", () => {
    if (!stage) throw new Error("cup 2 has no group stage");
    const groupA = ["a1", "a2", "a3", "a4", "a5"];
    const groupB = ["b1", "b2", "b3", "b4", "b5"];
    // Each group finishes in draw order: the earlier team wins every meeting.
    const played = (group: string[]) =>
      roundRobin(group).flat().map(([home, away]) =>
        group.indexOf(home) < group.indexOf(away) ? result(home, away, 60, 40) : result(home, away, 40, 60),
      );
    const tables = [groupTable(groupA, played(groupA), stage.points), groupTable(groupB, played(groupB), stage.points)];

    const seeds = groupQualifiers(tables, stage.qualify);
    expect(seeds).toEqual(["a1", "b1", "a2", "b2", "a3", "b3"]);

    const [quarters, semis] = seededBracket(seeds.length);
    const teamOf = (side: { seed: number } | { winnerOf: number }) =>
      "seed" in side ? seeds[side.seed - 1] : `winner of QF ${side.winnerOf + 1}`;
    expect(quarters?.map((tie) => tie.map(teamOf))).toEqual([
      ["b2", "a3"],
      ["a2", "b3"],
    ]);
    expect(semis?.map((tie) => tie.map(teamOf))).toEqual([
      ["a1", "winner of QF 1"],
      ["b1", "winner of QF 2"],
    ]);
  });
});
