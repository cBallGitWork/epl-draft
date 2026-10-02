import { describe, expect, it } from "vitest";
import { DEFCON, firstScored } from "./categoryNames";
import { defconPoints, type DefconPeriod } from "./defcon";
import realInfo from "./fantrax/__fixtures__/leagueInfoScoringReal.json";
import rehearsalCategories from "./fantrax/__fixtures__/scoringCategoriesRehearsal.json";
import { mapScoringCategories, mapScoringRules, type RawScoringSystem } from "./fantrax/scoring";

// The real league's getLeagueInfo of 1 Oct 2026: DFP pays a defender 1 at 3 and 2 at 5+; DFP3 pays a midfielder
// 1 at 8 and 2 at 11+, a forward 1 at 6 and 2 at 9+; each is worth nought at the other's slots.
const real = mapScoringRules(realInfo.scoringSystem as RawScoringSystem)!;
const codes = DEFCON.filter((category) => firstScored(mapScoringCategories(realInfo.scoringSystem as RawScoringSystem), [category]) !== null).map((category) => category.short);
const once = (DFP: number, DFP3: number): DefconPeriod => ({ played: 1, counts: { DFP, DFP3 } });

describe("which DefCon categories a league scores", () => {
  it("finds both in the real league and neither in the rehearsal", () => {
    expect(codes).toEqual(["DFP", "DFP3"]);
    expect(DEFCON.filter((category) => firstScored(mapScoringCategories(rehearsalCategories as RawScoringSystem), [category]) !== null)).toEqual([]);
  });
});

describe("defconPoints", () => {
  it("prices a defender's DFP match by match, never the season's sum at once", () => {
    expect(defconPoints(real, codes, "D", [once(3, 20), once(5, 20), once(2, 20)])).toBe(3);
    // Nine over three matches is 1 + 1 + 1; priced as one count it would be 2.
    expect(defconPoints(real, codes, "D", [once(3, 9), once(3, 9), once(3, 9)])).toBe(3);
  });

  it("prices a midfielder's and a forward's DFP3 at their own thresholds", () => {
    expect(defconPoints(real, codes, "M", [once(12, 8), once(12, 11), once(12, 7)])).toBe(3);
    expect(defconPoints(real, codes, "F", [once(12, 6), once(12, 9), once(12, 5)])).toBe(3);
  });

  it("prices the slot, not the man: the same counts pay a defender and a midfielder differently", () => {
    const counts = [once(5, 7)];
    expect(defconPoints(real, codes, "D", counts)).toBe(2);
    expect(defconPoints(real, codes, "M", counts)).toBe(0);
  });

  it("prices nothing in goal, where the rules carry no DefCon", () => {
    expect(defconPoints(real, codes, "G", [once(5, 11)])).toBeNull();
  });

  it("skips a period he did not play, and says nothing for a man who played in none", () => {
    expect(defconPoints(real, codes, "D", [{ played: 0, counts: { DFP: 0, DFP3: 0 } }, once(3, 9)])).toBe(1);
    expect(defconPoints(real, codes, "D", [])).toBeNull();
    expect(defconPoints(real, codes, "D", [{ played: 0, counts: { DFP: 0, DFP3: 0 } }])).toBeNull();
  });

  it("refuses a period that held two of his matches, or lacks a count", () => {
    expect(defconPoints(real, codes, "D", [once(3, 9), { played: 2, counts: { DFP: 8, DFP3: 20 } }])).toBeNull();
    expect(defconPoints(real, codes, "D", [{ played: 1, counts: { DFP3: 9 } }])).toBeNull();
  });
});
