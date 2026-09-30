import { describe, expect, it } from "vitest";
import type { Club, Fixture } from "../../football/types";
import { clubStandings } from "./standing";

const clubs: Club[] = [
  { id: 1, code: 101, name: "Alpha", shortName: "ALP" },
  { id: 2, code: 102, name: "Bravo", shortName: "BRA" },
  { id: 3, code: 103, name: "Charlie", shortName: "CHA" },
  { id: 4, code: 104, name: "Delta", shortName: "DEL" },
];
let next = 1;
const game = (day: string, home: number, away: number, h: number, a: number): Fixture => ({
  id: next, code: 9000 + next++, gameweek: null, homeClubId: home, awayClubId: away, kickoff: `${day}T14:00:00Z`,
  homeScore: h, awayScore: a, status: "finished", settled: true, minutes: 90, homeDifficulty: null, awayDifficulty: null,
});
// Bravo lose three, then win away on the 19th; Alpha win everything; a later match must not count.
const season = [
  game("2026-08-22", 1, 2, 2, 0), game("2026-08-22", 3, 4, 1, 1),
  game("2026-08-29", 2, 3, 0, 1), game("2026-08-29", 4, 1, 0, 3),
  game("2026-09-05", 1, 3, 1, 0), game("2026-09-05", 2, 4, 1, 2),
  game("2026-09-19", 4, 2, 0, 1), game("2026-09-19", 3, 1, 0, 2),
  game("2026-09-27", 2, 1, 5, 0),
];

describe("clubStandings", () => {
  const standings = clubStandings(season, clubs, "2026-09-19", [101, 102, 104]);

  it("reads the table as it stood after the day, not today", () => {
    expect(standings.get(101)?.after).toEqual({ place: 1, points: 12, played: 4 });
    expect(standings.get(101)?.lines).toEqual(expect.arrayContaining(["1st with 12 points from 4", "still top", "four wins in a row"]));
  });

  it("marks a first win, and a win that is also the first away win says only the first", () => {
    const bravo = standings.get(102)!;
    expect(bravo.lines).toContain("first win of the season");
    expect(bravo.lines.some((line) => line.includes("away win"))).toBe(false);
    expect(bravo.moved).toBe(true);
  });

  it("says where a club stood before the day", () => {
    expect(standings.get(102)?.before).toEqual({ place: 4, points: 0, played: 3 });
  });

  it("calls a winless start what it is", () => {
    const early = clubStandings(season, clubs, "2026-09-05", [102]);
    expect(early.get(102)?.lines).toContain("still without a win this season");
  });
});
