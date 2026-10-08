import { describe, expect, it } from "vitest";
import { mapSeasonResults } from "./results";
import type { RawSchedulePage } from "./results";
import seasonResults from "./__fixtures__/seasonResults.json";

// Trimmed from a live cookieless `getStandings?view=SCHEDULE`, edited to hold a scored row and a blank cell.

describe("mapSeasonResults", () => {
  const results = mapSeasonResults(seasonResults as RawSchedulePage);

  it("reads both teams and both totals out of one row", () => {
    expect(results).toContainEqual({ period: 1, teamId: "sezrgvl2mshcpazf", points: 51.5 });
    expect(results).toContainEqual({ period: 1, teamId: "pbxm9fgimshcpazf", points: 62 });
  });

  it("files each table under the period its caption names", () => {
    expect(results.filter((row) => row.period === 2)).toHaveLength(2);
  });

  it("keeps a blank total absent rather than nought", () => {
    // An unscored fixture is not a 0-0; the row beside it genuinely is on nought.
    expect(results).toContainEqual({ period: 1, teamId: "8enbgqo5msgb375j", points: null });
    expect(results).toContainEqual({ period: 1, teamId: "j9zadacnmshcpazf", points: 0 });
  });

  it("drops a table whose caption names no period", () => {
    // Filing it under a guessed number would put a result in the wrong week.
    expect(results.every((row) => row.period === 1 || row.period === 2)).toBe(true);
  });

  it("refuses to read a team's name as another team's score", () => {
    // A reordering Fantrax may make: unchecked, the first team would take team "123"'s name as its total.
    const reordered = mapSeasonResults({
      tableList: [
        {
          caption: "Gameweek 1",
          rows: [
            {
              cells: [
                { content: "test4", teamId: "a" },
                { content: "123", teamId: "b" },
                { content: "51.5" },
                { content: "62" },
              ],
            },
          ],
        },
      ],
    });
    expect(reordered.find((row) => row.teamId === "a")?.points).not.toBe(123);
    expect(reordered.find((row) => row.teamId === "b")?.points).toBe(51.5);
  });

  it("reads a total as Fantrax formats one, thousands comma and all", () => {
    const formatted = mapSeasonResults({ tableList: [{ caption: "Gameweek 1", rows: [{ cells: [{ content: "test4", teamId: "a" }, { content: "1,024.5" }] }] }] });
    expect(formatted).toEqual([{ period: 1, teamId: "a", points: 1024.5 }]);
  });

  it("answers nothing for a league with no schedule", () => {
    expect(mapSeasonResults({})).toEqual([]);
    expect(mapSeasonResults({ tableList: [] })).toEqual([]);
  });
});
