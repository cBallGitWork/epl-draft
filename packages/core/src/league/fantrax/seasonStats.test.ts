import { describe, expect, it } from "vitest";
import { mapSeasonStats, type RawSeasonStats } from "./seasonStats";
import fixture from "../__fixtures__/seasonStats.json";

// A cut of the live rehearsal payload: both headings, a category in both halves, the trailing-space caption and a
// keeper-only category.

const raw = fixture as RawSeasonStats;

const TEST3 = "j9zadacnmshcpazf";
const OWN = "8enbgqo5msgb375j";

describe("mapSeasonStats", () => {
  it("combines the two halves of a category rather than keeping one", () => {
    const minutes = mapSeasonStats(raw).get("Minutes Played") ?? [];
    const test3 = minutes.find((line) => line.teamId === TEST3);

    // 180 in goal + 1,382 on the field; by caption alone, table order would pick one.
    expect(test3?.value).toBe(1562);
    expect(test3?.points).toBe(38);
  });

  it("parses a figure Fantrax comma-groups", () => {
    const minutes = mapSeasonStats(raw).get("Minutes Played") ?? [];
    // "1,382" is not 1. Every minutes figure over a thousand carries the comma.
    expect(minutes.every((line) => (line.value ?? 0) > 100)).toBe(true);
  });

  it("files the outfield goals-against table under the keeper's category name", () => {
    const stats = mapSeasonStats(raw);

    // A trailing space and another name for the same fact: one category, both halves.
    expect(stats.has("Goals Against Outfielders")).toBe(false);
    expect(stats.has("Goals Against")).toBe(true);
  });

  it("keeps a keeper-only category rather than dropping it", () => {
    const saves = mapSeasonStats(raw).get("Saves") ?? [];
    expect(saves.length).toBeGreaterThan(0);
  });

  it("sums clean sheets across the halves for one team", () => {
    const sheets = mapSeasonStats(raw).get("Clean Sheets On Field") ?? [];
    const own = sheets.find((line) => line.teamId === OWN);

    // 0 in goal and 4 on the field, for 0 and 13 points, as the live payload has it.
    expect(own?.value).toBe(4);
    expect(own?.points).toBe(13);
  });

  it("ignores the summary and roll-up tables above the first heading", () => {
    // Before `Standings By Category - Goalkeeper` is another shape; a category named for one started the walk too early.
    const stats = mapSeasonStats(raw);
    expect(stats.has("Standings")).toBe(false);
    expect(stats.has("Standings By Category - Goalkeeper")).toBe(false);
  });

  it("survives an empty payload", () => {
    expect(mapSeasonStats({}).size).toBe(0);
  });

  it("reads points and the figure by the header when a date range drops the change columns", () => {
    // BY_DATE answers rank, fpts, team, pos, with no diff1 or diff2 either side of the team.
    const goals = mapSeasonStats({
      tableList: [
        { caption: "Standings By Category - Outfielder", rows: [] },
        {
          caption: "Goals",
          header: { cells: [{ key: "rank" }, { key: "fpts" }, { key: "team" }, { key: "pos" }] },
          rows: [{ cells: [{ content: "1" }, { content: "21" }, { content: "its_ohi", teamId: "t1" }, { content: "5" }] }],
        },
      ],
    }).get("Goals");
    expect(goals).toEqual([{ teamId: "t1", points: 21, value: 5 }]);
  });
});
