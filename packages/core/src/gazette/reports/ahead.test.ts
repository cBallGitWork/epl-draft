import { describe, expect, it } from "vitest";
import type { Club, Fixture } from "../../football/types";
import { nextMatch } from "./ahead";

const clubs: Club[] = Array.from({ length: 8 }, (_, i) => ({ id: i + 1, code: 100 + i + 1, name: `Club ${i + 1}`, shortName: `C${i + 1}` }));
const game = (day: string, home: number, away: number, finished = false): Fixture => ({
  id: home * 10 + away, code: home * 100 + away, gameweek: null, homeClubId: home, awayClubId: away, kickoff: `${day}T14:00:00Z`,
  homeScore: finished ? 1 : null, awayScore: finished ? 0 : null, status: finished ? "finished" : "upcoming", settled: finished,
  minutes: 0, homeDifficulty: null, awayDifficulty: null,
});
// Club 2 has already played Club 3 on the 27th; as of the 19th that is still to come.
const season = [game("2026-09-19", 1, 2, true), game("2026-09-27", 2, 3, true), game("2026-10-03", 4, 2), game("2026-10-17", 2, 5), game("2026-10-24", 6, 2)];

describe("nextMatch", () => {
  it("counts from the report's day, not today", () => {
    expect(nextMatch(season, clubs, 102, "2026-09-19")).toEqual({ opponent: "Club 3", home: true });
    expect(nextMatch(season, clubs, 102, "2026-09-27")).toEqual({ opponent: "Club 4", home: false });
  });

  it("has nothing for a club with nothing left", () => {
    expect(nextMatch(season, clubs, 102, "2026-10-24")).toBeNull();
  });
});
