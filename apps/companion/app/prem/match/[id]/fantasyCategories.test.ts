import { describe, expect, it } from "vitest";
import { mapLeagueInfo, type LeagueScoring } from "@epl/core";
import real from "../../../../../../packages/core/src/league/fantrax/__fixtures__/leagueInfoScoringReal.json";
import { fantasyBoxes, type FantasyMan } from "./fantasyCategories";

// The real league's getLeagueInfo of 1 Oct 2026, which scores AT, GKP, DFP and DFP3.
const info = mapLeagueInfo(real);
const scoring: LeagueScoring | null = info.scoring === null ? null : { rules: info.scoring, categories: info.scoringCategories };

let next = 1;
function man(position: string, counts: Record<string, number>): FantasyMan {
  const code = next++;
  return { code, name: `${position}${code}`, league: { position, counts } };
}

describe("fantasyBoxes on the real league", () => {
  it("counts assists under AT and a keeper's work under GKP, never the rehearsal's A and Sv", () => {
    const keeper = man("G", { GKP: 4, AT: 1, Sv: 3, A: 1 });
    const boxes = fantasyBoxes({ home: [keeper], away: [] }, scoring);
    expect(boxes.map((box) => [box.key, box.label])).toEqual([
      ["INDIVIDUAL_ASSISTS_TOTAL", "Assists (total)"],
      ["INDIVIDUAL_KEEPER_POINTS", "Keeper actions"],
    ]);
  });
});

describe("fantasyBoxes without the league", () => {
  it("shows nothing of ours when the league did not answer", () => {
    expect(fantasyBoxes({ home: [man("D", { G: 1 })], away: [] }, null)).toEqual([]);
  });
});
