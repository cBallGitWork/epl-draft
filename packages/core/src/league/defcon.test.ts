import { describe, expect, it } from "vitest";
import { defConAt } from "./defcon";
import { mapLeagueInfo } from "./fantrax/map";
import real from "./fantrax/__fixtures__/leagueInfoScoringReal.json";
import rehearsal from "./fantrax/__fixtures__/leagueInfoScoringRehearsal.json";
import type { LeagueScoring } from "./scoring";

// Both leagues' getLeagueInfo as they stood on 1 Oct 2026.
function scoringOf(info: ReturnType<typeof mapLeagueInfo>): LeagueScoring {
  if (info.scoring === null) throw new Error("fixture carries no scoring");
  return { rules: info.scoring, categories: info.scoringCategories };
}

describe("defConAt on the real league's table", () => {
  const scoring = scoringOf(mapLeagueInfo(real));

  it("is close at 1 for a defender, 4 for a midfielder and 3 for a forward: half of 3, 8 and 6", () => {
    expect(defConAt(scoring, "D")).toEqual({ short: "DFP", mark: 3, close: 1 });
    expect(defConAt(scoring, "M")).toEqual({ short: "DFP3", mark: 8, close: 4 });
    expect(defConAt(scoring, "F")).toEqual({ short: "DFP3", mark: 6, close: 3 });
  });

  it("prices no DefCon for a keeper", () => {
    expect(defConAt(scoring, "G")).toBeNull();
  });
});

describe("defConAt on a league that scores no DefCon", () => {
  it("answers nothing at any slot", () => {
    const scoring = scoringOf(mapLeagueInfo(rehearsal));
    expect(["G", "D", "M", "F"].map((slot) => defConAt(scoring, slot))).toEqual([null, null, null, null]);
  });
});
