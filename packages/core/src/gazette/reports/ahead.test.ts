import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { strengthIntel, strengthPlaces, type IntelStrength } from "../../football/intel/strength";
import type { Club, Fixture } from "../../football/types";
import { nextThree } from "./ahead";

const clubs: Club[] = Array.from({ length: 8 }, (_, i) => ({ id: i + 1, code: 100 + i + 1, name: `Club ${i + 1}`, shortName: `C${i + 1}` }));
const game = (day: string, home: number, away: number, finished = false): Fixture => ({
  id: home * 10 + away, code: home * 100 + away, gameweek: null, homeClubId: home, awayClubId: away, kickoff: `${day}T14:00:00Z`,
  homeScore: finished ? 1 : null, awayScore: finished ? 0 : null, status: finished ? "finished" : "upcoming", settled: finished,
  minutes: 0, homeDifficulty: null, awayDifficulty: null,
});
// Club 2 has already played Club 3 on the 27th; as of the 19th that is still to come.
const season = [game("2026-09-19", 1, 2, true), game("2026-09-27", 2, 3, true), game("2026-10-03", 4, 2), game("2026-10-17", 2, 5), game("2026-10-24", 6, 2)];
const places = new Map(clubs.map((c, i) => [c.code, i + 1]));

describe("nextThree", () => {
  it("counts from the report's day, not today", () => {
    const next = nextThree(season, clubs, 102, "2026-09-19", { attack: places, defence: places });
    expect(next.map((m) => `${m.opponent} ${m.home ? "h" : "a"}`)).toEqual(["Club 3 h", "Club 4 a", "Club 5 h"]);
  });

  it("describes an opponent only at an end of the ratings", () => {
    const next = nextThree(season, clubs, 102, "2026-09-19", { attack: places, defence: places });
    expect(next[0].words).toEqual(["a dangerous attack", "a tough defence to score against"]);
    expect(next[2].words).toEqual([]);
  });

  it("reads the sister repo's places the right way up: Man City dangerous, Hull soft", () => {
    const file = JSON.parse(readFileSync(new URL("../../football/__fixtures__/intelStrength.json", import.meta.url), "utf8")) as IntelStrength;
    const strengths = strengthIntel(file);
    const table = { attack: strengthPlaces(strengths, "attack"), defence: strengthPlaces(strengths, "defence") };
    const real: Club[] = [{ id: 1, code: 54, name: "Fulham", shortName: "FUL" }, { id: 2, code: 43, name: "Man City", shortName: "MCI" }, { id: 3, code: 88, name: "Hull", shortName: "HUL" }];
    const next = nextThree([game("2026-10-03", 1, 2), game("2026-10-17", 3, 1)], real, 54, "2026-09-19", table);
    expect(next.map((m) => m.words)).toEqual([["a dangerous attack", "a tough defence to score against"], ["a weak attack", "a soft defence"]]);
  });
});
