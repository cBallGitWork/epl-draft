import { describe, expect, it } from "vitest";
import { mapPlayerProfile } from "./profile";
import type { RawPlayerProfile } from "./profile";
import fixture from "./__fixtures__/playerProfile.json";

// Two real profiles, probed 12 Aug 2026: a rostered dual-eligible player and a
// free agent nobody in the league wants. The pair is the point — every field that
// distinguishes an owned player from an unowned one is only visible across both.

const rostered = mapPlayerProfile(fixture.rostered as RawPlayerProfile);
const freeAgent = mapPlayerProfile(fixture.freeAgent as RawPlayerProfile);

const labelled = (rows: { label: string; value: string }[], label: string) =>
  rows.find((row) => row.label === label)?.value;

describe("mapPlayerProfile", () => {
  it("names the season the numbers belong to, which is not the current one", () => {
    // The trap this whole module is shaped around. `season` says 2026-27 and the
    // response is serving 2025-26, because no gameweek of the new season has been
    // played — so a page showing "110 points" without the year would be claiming
    // a return from a season that has not started.
    expect(rostered.season).toBe("2025-26");
    expect(fixture.rostered.season.displayName).toBe("2026-27");
  });

  it("keeps the season inside the label as well, unparsed", () => {
    const points = rostered.highlights.find((row) => row.label === "FPts");
    expect(points?.value).toBe("110");
    expect(points?.description).toContain("2025-26");
  });

  it("separates our league's row from the whole of Fantrax", () => {
    // "100%" here means every league on the site, and it sits one field away from
    // ownership in ours. Different lists, so no render can put them side by side
    // without saying which is which.
    expect(labelled(rostered.league, "Status/Team")).toBe("test3");
    expect(labelled(rostered.league, "Eligible")).toBe("M,F");
    expect(labelled(rostered.market, "Drafted")).toBe("100%");
    expect(labelled(rostered.market, "ADP")).toBe("3.64");
  });

  it("tells an owned player from a free agent", () => {
    expect(rostered.ownerTeamId).toBe("j9zadacnmshcpazf");
    expect(freeAgent.ownerTeamId).toBeNull();
    expect(labelled(freeAgent.league, "Status/Team")).toBe("FA");
    // Still has a market — a player nobody here wants is wanted somewhere.
    expect(labelled(freeAgent.market, "ADP")).toBe("282.1");
  });

  it("drops rows with nothing in them and keeps numeric ones", () => {
    // Fantrax pads the personal block with empty rows for fields other sports
    // use, and files age as a number while everything else is a string.
    expect(rostered.personal.every((row) => row.value !== "")).toBe(true);
    expect(labelled(rostered.personal, "Age")).toBe("24");
    expect(rostered.personal.map((row) => row.label)).not.toContain("College");
  });

  it("reads the season row positionally, header cell against row cell", () => {
    const withStats = mapPlayerProfile({
      sectionContent: {
        OVERVIEW: {
          tables: [
            // Several rows: not the season table. Listed first on purpose — the
            // real payload puts Recent Games straight after it.
            {
              caption: "Recent Games",
              header: { cells: [{ shortName: "Date" }, { shortName: "FPts" }] },
              rows: [{ cells: [{ content: "Aug 30" }] }, { cells: [{ content: "Aug 22" }] }],
            },
            {
              caption: "2026-27 Stats",
              header: {
                cells: [
                  { shortName: "GP", name: "Games Played" },
                  { shortName: "S", name: "Shots" },
                  { shortName: "FC", name: "Fouls Committed" },
                ],
              },
              rows: [{ cells: [{ content: "2" }, { content: "3" }, { content: "2" }] }],
            },
          ],
        },
      },
    });
    expect(withStats.stats.map((row) => `${row.label}=${row.value}`)).toEqual([
      "GP=2",
      "S=3",
      "FC=2",
    ]);
    expect(withStats.stats[1].description).toBe("Shots");
  });

  it("drops a column whose cell is missing rather than sliding the rest up", () => {
    // Positional reading's one hazard: a short row must not pair Shots with
    // Fouls. A pair that cannot be made is dropped, never shifted.
    const ragged = mapPlayerProfile({
      sectionContent: {
        OVERVIEW: {
          tables: [
            {
              header: { cells: [{ shortName: "GP" }, { shortName: "S" }, { shortName: "FC" }] },
              rows: [{ cells: [{ content: "2" }, {}, { content: "2" }] }],
            },
          ],
        },
      },
    });
    expect(ragged.stats.map((row) => `${row.label}=${row.value}`)).toEqual(["GP=2", "FC=2"]);
  });

  it("has no season row when Fantrax sends no single-row table", () => {
    expect(mapPlayerProfile({ sectionContent: { OVERVIEW: { tables: [] } } }).stats).toEqual([]);
    expect(mapPlayerProfile({}).stats).toEqual([]);
  });

  it("reads his recent matches by stat id, not by column label", () => {
    const withGames = mapPlayerProfile({
      sectionContent: {
        OVERVIEW: {
          tables: [
            {
              caption: "Recent Games",
              header: {
                cells: [
                  { key: "date", shortName: "Date" },
                  { key: "opponent", shortName: "Opp" },
                  { key: "fpts", shortName: "FPts" },
                  { key: "6210#-1", shortName: "S" },
                ],
              },
              rows: [
                { cells: [{ content: "Aug 30" }, { content: "IPS" }, { content: "3" }, { content: "1" }] },
                { cells: [{ content: "Aug 22" }, { content: "@HUL" }, { content: "0" }, { content: "2" }] },
              ],
            },
          ],
        },
      },
    });
    expect(withGames.matches).toHaveLength(2);
    expect(withGames.matches[0]).toMatchObject({ opponent: "IPS", home: true, points: 3, shots: 1 });
    // `@` is Fantrax's away marker and this is where it stops being a string.
    expect(withGames.matches[1]).toMatchObject({ opponent: "HUL", home: false, points: 0 });
  });

  it("does not mistake the other four tables for the match one", () => {
    // `Upcoming Games` names its column `opp`, `Recent Trends` prefixes every id
    // with `5010#`, and the season table has no opponent at all. Only the match
    // table carries both `opponent` and `fpts`.
    const decoys = mapPlayerProfile({
      sectionContent: {
        OVERVIEW: {
          tables: [
            { caption: "Upcoming Games", header: { cells: [{ key: "date" }, { key: "opp" }] }, rows: [{ cells: [{}, {}] }] },
            { caption: "Recent Trends", header: { cells: [{ key: "trend" }, { key: "fpts" }] }, rows: [{ cells: [{}, {}] }] },
          ],
        },
      },
    });
    expect(decoys.matches).toEqual([]);
  });

  it("reads a figure it cannot parse as absent, not as nought", () => {
    const ragged = mapPlayerProfile({
      sectionContent: {
        OVERVIEW: {
          tables: [
            {
              header: { cells: [{ key: "opponent" }, { key: "fpts" }, { key: "6210#-1" }] },
              rows: [{ cells: [{ content: "IPS" }, { content: "-" }, {}] }],
            },
          ],
        },
      },
    });
    expect(ragged.matches[0]).toMatchObject({ opponent: "IPS", points: null, shots: null });
  });

  it("survives a payload with nothing in it", () => {
    // Every field on the wire is optional here as on fxea, and a profile we
    // cannot read must render as an empty page rather than throw one.
    const empty = mapPlayerProfile({});
    expect(empty).toMatchObject({ name: "", season: null, ownerTeamId: null });
    expect(empty.matches).toEqual([]);
    expect([empty.league, empty.highlights, empty.market, empty.personal]).toEqual([[], [], [], []]);
  });
});
