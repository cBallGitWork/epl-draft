import { describe, expect, it } from "vitest";
import { mapStandings } from "./standings";
import type { RawStandings } from "./raw";
import standingsDrafted from "./__fixtures__/standingsDrafted.json";
import standings from "./__fixtures__/standings.json";

// Two fixtures because there are two real states: the rehearsal league's four
// teams (drafted, nothing played) and the real league's `[]` (nobody has joined).

describe("mapStandings", () => {
  const rows = mapStandings(standingsDrafted as RawStandings);

  it("reads every team's row", () => {
    expect(rows).toHaveLength(4);
    expect(rows.map((row) => row.teamName)).toContain("123");
  });

  it("orders by rank", () => {
    expect(rows.map((row) => row.rank)).toEqual([1, 2, 3, 4]);
  });

  it("keeps the record as Fantrax formatted it", () => {
    // "0-0-0" is win-loss-tie. Splitting it now would be inferring a format from
    // an all-zero sample; the first played gameweek is when that becomes real.
    expect(rows[0]?.record).toBe("0-0-0");
    expect(rows[0]?.pointsFor).toBe(0);
  });

  it("returns nothing for a league nobody has joined", () => {
    expect(mapStandings(standings as RawStandings)).toEqual([]);
  });
});
