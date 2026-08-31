import { describe, expect, it } from "vitest";
import { leagueTable } from "./table";
import type { Club, Fixture } from "./types";

const clubs: Club[] = [
  { id: 1, code: 3, name: "Arsenal", shortName: "ARS" },
  { id: 2, code: 7, name: "Aston Villa", shortName: "AVL" },
  { id: 3, code: 8, name: "Chelsea", shortName: "CHE" },
];

const fixture = (over: Partial<Fixture>): Fixture => ({
  id: 1,
  gameweek: 1,
  homeClubId: 1,
  awayClubId: 2,
  kickoff: "2026-08-15T14:00:00.000Z",
  homeScore: null,
  awayScore: null,
  status: "finished",
  settled: true,
  minutes: 90,
  homeDifficulty: null,
  awayDifficulty: null,
  ...over,
});

describe("leagueTable", () => {
  it("gives three for a win and one each for a draw", () => {
    const table = leagueTable(
      [
        fixture({ id: 1, homeClubId: 1, awayClubId: 2, homeScore: 2, awayScore: 1 }),
        fixture({ id: 2, homeClubId: 2, awayClubId: 3, homeScore: 0, awayScore: 0 }),
      ],
      clubs,
    );
    // Villa and Chelsea both have a point; Villa also lost to Arsenal, so
    // goal difference separates them and Chelsea is above.
    expect(table.map((row) => [row.shortName, row.played, row.points])).toEqual([
      ["ARS", 1, 3],
      ["CHE", 1, 1],
      ["AVL", 2, 1],
    ]);
  });

  it("counts nothing from a match still being played", () => {
    // FPL writes a running score onto a fixture in play, and a table counting
    // those would move a club up the order for leading at half time.
    const table = leagueTable(
      [fixture({ status: "live", homeScore: 3, awayScore: 0, settled: false })],
      clubs,
    );
    expect(table.every((row) => row.played === 0)).toBe(true);
  });

  it("orders on points, then goal difference, then goals scored", () => {
    const table = leagueTable(
      [
        // ARS and CHE both win once; ARS by three, CHE by one.
        fixture({ id: 1, homeClubId: 1, awayClubId: 2, homeScore: 3, awayScore: 0 }),
        fixture({ id: 2, homeClubId: 3, awayClubId: 2, homeScore: 1, awayScore: 0 }),
      ],
      clubs,
    );
    expect(table.map((row) => row.shortName)).toEqual(["ARS", "CHE", "AVL"]);
    expect(table[0].goalDifference).toBe(3);
    expect(table[2].goalDifference).toBe(-4);
  });

  it("counts a fixture for neither side when it names a club we do not carry", () => {
    const table = leagueTable(
      [fixture({ homeClubId: 1, awayClubId: 99, homeScore: 5, awayScore: 0 })],
      clubs,
    );
    // Half a result is worse than none: the winner would climb on a match the
    // table cannot show the other half of.
    expect(table.every((row) => row.played === 0)).toBe(true);
  });

  it("carries every club, including one that has not played", () => {
    expect(leagueTable([], clubs)).toHaveLength(3);
  });
});
