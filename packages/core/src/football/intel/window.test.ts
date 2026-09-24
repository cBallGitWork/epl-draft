import { describe, expect, it } from "vitest";
import type { Fixture } from "../types";
import { fixtureGameweeks, gameweekSpan, inGameweeks, lastPlayed } from "./window";

function fixture(id: number, gameweek: number | null, status: Fixture["status"]): Fixture {
  return {
    id,
    code: id,
    gameweek,
    homeClubId: 1,
    awayClubId: 2,
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

const FIXTURES = [
  fixture(1, 1, "finished"),
  fixture(2, 2, "finished"),
  fixture(3, 3, "finished"),
  fixture(4, 4, "live"),
  fixture(5, 5, "upcoming"),
  fixture(6, null, "upcoming"),
];

describe("lastPlayed", () => {
  it("takes the most recent gameweeks with a match finished, oldest first", () => {
    expect(lastPlayed(FIXTURES, 2)).toEqual([2, 3]);
  });

  it("takes what there is when fewer have been played", () => {
    expect(lastPlayed(FIXTURES, 6)).toEqual([1, 2, 3]);
  });
});

describe("fixtureGameweeks", () => {
  it("files each scheduled fixture under its gameweek and skips an unscheduled one", () => {
    const map = fixtureGameweeks(FIXTURES);
    expect(map.get(3)).toBe(3);
    expect(map.has(6)).toBe(false);
  });
});

describe("inGameweeks", () => {
  it("keeps the rows from fixtures in the window", () => {
    const rows = [{ fplFixtureId: 1 }, { fplFixtureId: 3 }, { fplFixtureId: 99 }];
    expect(inGameweeks(rows, fixtureGameweeks(FIXTURES), new Set([3]))).toEqual([{ fplFixtureId: 3 }]);
  });
});

describe("gameweekSpan", () => {
  it("names a window by its ends, and a one-week window by its week", () => {
    expect(gameweekSpan([6, 7, 8, 9, 10, 11])).toBe("GW6–11");
    expect(gameweekSpan([6])).toBe("GW6");
  });

  it("is empty for no gameweeks at all", () => {
    expect(gameweekSpan([])).toBe("");
  });
});
