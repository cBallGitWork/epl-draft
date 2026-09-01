import { describe, expect, it } from "vitest";
import { mapSeasonStats, type RawSeasonStats } from "./seasonStats";
import fixture from "../__fixtures__/seasonStats.json";

// The fixture is a cut of the live rehearsal payload (1 Sep 2026), kept to the
// tables that carry the traps: both section headings, a category in both halves,
// the trailing-space caption and a keeper-only category.

const raw = fixture as RawSeasonStats;

const TEST3 = "j9zadacnmshcpazf";
const OWN = "8enbgqo5msgb375j";

describe("mapSeasonStats", () => {
  it("combines the two halves of a category rather than keeping one", () => {
    const minutes = mapSeasonStats(raw).get("Minutes Played") ?? [];
    const test3 = minutes.find((line) => line.teamId === TEST3);

    // 180 in goal + 1,382 on the field. Reading by caption alone would answer
    // one of the two, and which one depends only on table order.
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

    // Fantrax's caption has a trailing space and a different name for the same
    // defensive fact. One category, both halves.
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

    // 0 in goal and 4 on the field, for 0 and 13 points — checked against the
    // live payload, so this is the arithmetic and not a guess.
    expect(own?.value).toBe(4);
    expect(own?.points).toBe(13);
  });

  it("ignores the summary and roll-up tables above the first heading", () => {
    // Everything before `Standings By Category - Goalkeeper` is a different
    // shape. A category named for one of them means the walk started too early.
    const stats = mapSeasonStats(raw);
    expect(stats.has("Standings")).toBe(false);
    expect(stats.has("Standings By Category - Goalkeeper")).toBe(false);
  });

  it("survives an empty payload", () => {
    expect(mapSeasonStats({}).size).toBe(0);
  });
});
