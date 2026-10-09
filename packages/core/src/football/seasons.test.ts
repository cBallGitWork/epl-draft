import { describe, expect, it } from "vitest";
import { mapPastSeasons } from "./seasons";
import type { RawElementSummary } from "./fpl/raw";
import saka from "./__fixtures__/elementSummary.json";

// Saka's recorded `element-summary`, as in the game log's tests: eight completed seasons, 2018/19 to 2025/26.

const summary = saka as RawElementSummary;

describe("mapPastSeasons", () => {
  it("returns every completed season", () => {
    expect(mapPastSeasons(summary)).toHaveLength(8);
  });

  it("puts the most recent season first", () => {
    const seasons = mapPastSeasons(summary).map((s) => s.season);
    expect(seasons[0]).toBe("2025/26");
    expect(seasons.at(-1)).toBe("2018/19");
    expect(seasons).toEqual([...seasons].sort().reverse());
  });

  it("carries FPL's own label rather than computing one", () => {
    expect(mapPastSeasons(summary).map((s) => s.season)).toContain("2020/21");
  });

  it("reads the figures off the season they belong to", () => {
    const latest = mapPastSeasons(summary)[0];
    const raw = summary.history_past.find((s) => s.season_name === "2025/26");
    expect(raw).toBeDefined();
    expect(latest.minutes).toBe(raw?.minutes);
    expect(latest.goals).toBe(raw?.goals_scored);
    expect(latest.assists).toBe(raw?.assists);
    expect(latest.fplPoints).toBe(raw?.total_points);
  });

  it("keeps a season he did not play", () => {
    // Unlike an unplayed MATCH, which the game log drops, a zero-minute season
    // is a fact about a man who was at the club and did not get on.
    const blank: RawElementSummary = {
      history: [],
      history_past: [
        {
          season_name: "2017/18",
          total_points: 0,
          minutes: 0,
          goals_scored: 0,
          assists: 0,
          clean_sheets: 0,
          goals_conceded: 0,
          yellow_cards: 0,
          red_cards: 0,
          saves: 0,
        },
      ],
    };
    expect(mapPastSeasons(blank)).toHaveLength(1);
    expect(mapPastSeasons(blank)[0].minutes).toBe(0);
  });

  it("survives a payload with no completed seasons", () => {
    // A debutant. FPL sends `history_past: []`, and an academy player promoted
    // mid-season has been seen without the key at all.
    expect(mapPastSeasons({ history: [], history_past: [] })).toEqual([]);
    expect(mapPastSeasons({ history: [] } as unknown as RawElementSummary)).toEqual([]);
  });
});
