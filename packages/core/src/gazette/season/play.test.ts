import { describe, expect, it } from "vitest";
import { formations } from "../../league/formations";
import type { SeasonMan } from "./men";
import { playSeason } from "./play";

// A one-a-side league: a keeper and an outfielder, so the shape is plain.
const shapes = formations({
  maxTotalPlayers: 3,
  maxActivePlayers: 2,
  maxReservePlayers: 1,
  maxActiveByPosition: { G: 1, F: 1 },
  minActiveByPosition: { G: 1, F: 1 },
});
const man = (fantraxId: string, slot: string, points: number, spread = 0): SeasonMan => ({
  fantraxId,
  code: 0,
  name: fantraxId,
  periods: new Map([1, 2].map((period) => [period, { [slot]: points }])),
  spread,
  season: points * 2,
});
const matchups = [
  { period: 1, homeTeamId: "a", awayTeamId: "b" },
  { period: 2, homeTeamId: "b", awayTeamId: "a" },
];

describe("playSeason", () => {
  it("fields each squad's best allowed eleven every period and plays the schedule with it", () => {
    const squads = [
      { teamId: "a", name: "A", men: [man("a-g", "G", 3), man("a-f", "F", 6), man("a-f2", "F", 2)] },
      { teamId: "b", name: "B", men: [man("b-g", "G", 4), man("b-f", "F", 4)] },
    ];
    const played = playSeason({ squads, shapes, together: 0.5, matchups, runs: 1, seed: 1 });
    expect(played.table.map((row) => [row.teamId, row.placed[0]])).toEqual([["a", 1], ["b", 0]]);
    expect(played.lines.get("a")).toEqual({ G: 6, F: 12 });
    expect(played.short).toEqual([]);
  });

  it("scores nothing in a period a squad cannot fill, and says so", () => {
    const squads = [
      { teamId: "a", name: "A", men: [man("a-f", "F", 6)] },
      { teamId: "b", name: "B", men: [man("b-g", "G", 1), man("b-f", "F", 1)] },
    ];
    const played = playSeason({ squads, shapes, together: 0.5, matchups, runs: 1, seed: 1 });
    expect(played.short).toEqual([{ teamId: "a", period: 1 }, { teamId: "a", period: 2 }]);
    expect(played.table[0].teamId).toBe("b");
  });

  it("swings a side further the more its men move together", () => {
    const squads = (spread: number) => [
      { teamId: "a", name: "A", men: [man("a-g", "G", 5, spread), man("a-f", "F", 5, spread)] },
      { teamId: "b", name: "B", men: [man("b-g", "G", 5.2, spread), man("b-f", "F", 5, spread)] },
    ];
    const upsets = (together: number) => playSeason({ squads: squads(0.5), shapes, together, matchups, runs: 4000, seed: 3 }).table.find((row) => row.teamId === "a")?.placed[0] ?? 0;
    expect(upsets(1)).toBeGreaterThan(upsets(0));
  });
});
