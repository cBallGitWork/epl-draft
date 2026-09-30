import { describe, expect, it } from "vitest";
import type { Club, Fixture } from "../types";
import {
  type ClubStrength,
  type IntelStrength,
  easeRanks,
  plannerGameweeks,
  easeStep,
  plannerRows,
  strengthIntel,
  strengthTable,
} from "./strength";

function club(id: number, shortName: string): Club {
  return { id, code: id * 10, name: shortName, shortName };
}

function strength(c: Club, attack: number, defence: number): ClubStrength {
  return {
    code: c.code,
    shortName: c.shortName,
    attack: { home: attack, away: attack - 0.1 },
    defence: { home: defence, away: defence - 0.1 },
    games: { home: 2, away: 3 },
  };
}

function fixture(id: number, gameweek: number | null, home: Club, away: Club, status: Fixture["status"] = "upcoming"): Fixture {
  return {
    id,
    code: id,
    gameweek,
    homeClubId: home.id,
    awayClubId: away.id,
    kickoff: null,
    homeScore: null,
    awayScore: null,
    status,
    settled: false,
    minutes: 0,
    homeDifficulty: null,
    awayDifficulty: null,
  };
}

const ARS = club(1, "ARS");
const BUR = club(2, "BUR");
const CHE = club(3, "CHE");
const HUL = club(4, "HUL");
const CLUBS = [ARS, BUR, CHE, HUL];

// Arsenal: best defence, best attack. Hull: worst at both. Chelsea ties Burnley at the back.
const STRENGTHS = new Map(
  [strength(ARS, 1.3, 1.7), strength(BUR, 1.0, 1.0), strength(CHE, 1.1, 1.0), strength(HUL, 0.8, 0.7)].map(
    (s) => [s.code, s],
  ),
);

function file(clubs: unknown[]): IntelStrength {
  return {
    manifest: { season: "26-27", gameweek: null, exportedAt: "2026-09-24T09:00:00Z", rows: clubs.length, sources: [] },
    clubs: clubs as ClubStrength[],
  };
}

describe("strengthIntel", () => {
  it("keys each club on its code", () => {
    expect([...strengthIntel(file([...STRENGTHS.values()])).keys()]).toEqual([10, 20, 30, 40]);
  });

  it("drops a club whose rating is not a positive number, and reads a missing file as none", () => {
    const broken = { ...strength(ARS, 1.3, 1.7), defence: { home: Number.NaN, away: 1 } };
    expect(strengthIntel(file([broken, strength(HUL, 0.8, 0.7)])).size).toBe(1);
    expect(strengthIntel(null).size).toBe(0);
  });
});

describe("easeRanks", () => {
  it("ranks an attack's opponents by their defence, weakest first", () => {
    const ranks = easeRanks(STRENGTHS, "attack", "home");
    expect(ranks.get(HUL.code)).toBe(1);
    expect(ranks.get(ARS.code)).toBe(4);
  });

  it("ranks a defence's opponents by their attack, weakest first", () => {
    const ranks = easeRanks(STRENGTHS, "defence", "away");
    expect([HUL, BUR, CHE, ARS].map((c) => ranks.get(c.code))).toEqual([1, 2, 3, 4]);
  });

  it("gives tied clubs one rank and skips the next", () => {
    const ranks = easeRanks(STRENGTHS, "attack", "home");
    expect([BUR, CHE].map((c) => ranks.get(c.code))).toEqual([2, 2]);
    expect(ranks.get(ARS.code)).toBe(4);
  });

  it("reads the venue asked for", () => {
    const lopsided = new Map(STRENGTHS);
    lopsided.set(HUL.code, { ...strength(HUL, 0.8, 0.7), defence: { home: 0.7, away: 2.0 } });
    expect(easeRanks(lopsided, "attack", "home").get(HUL.code)).toBe(1);
    expect(easeRanks(lopsided, "attack", "away").get(HUL.code)).toBe(4);
  });
});

describe("easeStep", () => {
  it("puts two ranks on each of ten steps (Craig, 24 Sep 2026: a bigger range of colours)", () => {
    expect([1, 2, 3, 4, 10, 11, 19, 20].map(easeStep)).toEqual([1, 1, 2, 2, 5, 6, 10, 10]);
  });
});

describe("strengthTable", () => {
  it("ranks every club's own attack at both venues, the weakest first: 1 is the easiest to face (Craig, 30 Sep 2026)", () => {
    const table = strengthTable(STRENGTHS, "attack");
    expect(table.map((row) => row.club)).toEqual(["HUL", "BUR", "CHE", "ARS"]);
    expect(table[0]).toMatchObject({ club: "HUL", code: HUL.code, home: 1, away: 1 });
  });

  it("ranks defences the same way, a tie sharing its rank and falling to the name", () => {
    const table = strengthTable(STRENGTHS, "defence");
    expect(table.map((row) => [row.club, row.home])).toEqual([["HUL", 1], ["BUR", 2], ["CHE", 2], ["ARS", 4]]);
  });

  it("agrees with the planner's cells: a club's rank here is the rank its opponents see", () => {
    const table = strengthTable(STRENGTHS, "defence");
    const cells = easeRanks(STRENGTHS, "attack", "home");
    for (const row of table) expect(cells.get(row.code)).toBe(row.home);
  });
});

describe("plannerGameweeks", () => {
  it("starts at the first round with a match still to finish", () => {
    const fixtures = [
      fixture(1, 5, ARS, BUR, "finished"),
      fixture(2, 6, ARS, CHE),
      fixture(3, 7, BUR, HUL),
      fixture(4, 9, CHE, HUL),
    ];
    expect(plannerGameweeks(fixtures, 3)).toEqual([6, 7, 8]);
  });

  it("is empty once the season has no match left", () => {
    expect(plannerGameweeks([fixture(1, 38, ARS, BUR, "finished")], 6)).toEqual([]);
  });
});

describe("plannerRows", () => {
  const fixtures = [
    fixture(1, 6, ARS, HUL),
    fixture(2, 6, BUR, CHE),
    fixture(3, 7, HUL, BUR),
    fixture(4, 7, CHE, ARS),
    // A double for Hull in 7, and a blank for Arsenal and Chelsea in 8.
    fixture(5, 7, HUL, CHE),
    fixture(6, 8, BUR, HUL),
  ];
  const rows = plannerRows(fixtures, CLUBS, STRENGTHS, "attack", [6, 7, 8]);
  const row = (c: Club) => rows.find((r) => r.club.code === c.code);

  it("reads each opponent at the venue he plays", () => {
    // Arsenal at home to Hull: Hull's AWAY defence, the league's weakest.
    expect(row(ARS)?.cells[0]).toEqual([{ opponent: HUL, home: true, rank: 1 }]);
    expect(row(HUL)?.cells[0]).toEqual([{ opponent: ARS, home: false, rank: 4 }]);
  });

  it("stacks a double and leaves a blank empty", () => {
    expect(row(HUL)?.cells[1].map((cell) => cell.opponent.shortName)).toEqual(["BUR", "CHE"]);
    expect(row(ARS)?.cells[2]).toEqual([]);
  });

  it("averages a double, counts a blank as the hardest, and orders the easiest run first", () => {
    // Hull: ARS 4, then (BUR 2 + CHE 2) / 2 = 2, then BUR 2 → 8 / 3.
    expect(row(HUL)?.mean).toBeCloseTo(8 / 3);
    // Arsenal: HUL 1, CHE 2, blank 4 → 7 / 3.
    expect(row(ARS)?.mean).toBeCloseTo(7 / 3);
    const means = rows.map((r) => r.mean);
    expect(means).toEqual([...means].sort((a, b) => a - b));
  });

  it("breaks a tie on the nearer gameweek", () => {
    // Burnley and Chelsea both face one side each week; Chelsea's first opponent is the easier.
    const tied = [fixture(7, 6, BUR, ARS), fixture(8, 6, CHE, HUL), fixture(9, 7, BUR, HUL), fixture(10, 7, CHE, ARS)];
    const rows = plannerRows(tied, CLUBS, STRENGTHS, "attack", [6, 7]).map((r) => r.club.shortName);
    expect(rows.filter((name) => name === "BUR" || name === "CHE")).toEqual(["CHE", "BUR"]);
  });

  it("draws a club every row, even one with no match in the window", () => {
    expect(plannerRows([], CLUBS, STRENGTHS, "defence", [6]).map((r) => r.cells)).toEqual([[[]], [[]], [[]], [[]]]);
  });

  it("leaves a rank null when the opponent has no rating", () => {
    const partial = new Map([...STRENGTHS].filter(([code]) => code !== HUL.code));
    const arsenal = plannerRows(fixtures, CLUBS, partial, "attack", [6]).find((r) => r.club.code === ARS.code);
    expect(arsenal?.cells[0]).toEqual([{ opponent: HUL, home: true, rank: null }]);
  });
});
