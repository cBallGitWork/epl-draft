import { describe, expect, it } from "vitest";
import { bestDefConPoints, defConAt, defConPoints, defConScored, type DefConPeriod } from "./defcon";
import { mapLeagueInfo } from "./fantrax/map";
import real from "./fantrax/__fixtures__/leagueInfoScoringReal.json";
import rehearsal from "./fantrax/__fixtures__/leagueInfoScoringRehearsal.json";
import type { LeagueScoring } from "./scoring";

// Both leagues' getLeagueInfo as they stood on 1 Oct 2026. The real league's DFP pays a defender 1 at 3 and 2 at 5+;
// its DFP3 pays a midfielder 1 at 8 and 2 at 11+, a forward 1 at 6 and 2 at 9+; each is worth nought at the other's slots.
function scoringOf(info: ReturnType<typeof mapLeagueInfo>): LeagueScoring {
  if (info.scoring === null) throw new Error("fixture carries no scoring");
  return { rules: info.scoring, categories: info.scoringCategories };
}
const realScoring = scoringOf(mapLeagueInfo(real));
const rehearsalScoring = scoringOf(mapLeagueInfo(rehearsal));

describe("which DefCon categories a league scores", () => {
  it("finds both in the real league and neither in the rehearsal", () => {
    expect(defConScored(realScoring.categories).map((category) => category.short)).toEqual(["DFP", "DFP3"]);
    expect(defConScored(rehearsalScoring.categories)).toEqual([]);
  });
});

describe("defConAt on the real league's table", () => {
  it("is close at 1 for a defender, 4 for a midfielder and 3 for a forward: half of 3, 8 and 6", () => {
    expect(defConAt(realScoring, "D")).toEqual({ short: "DFP", mark: 3, close: 1 });
    expect(defConAt(realScoring, "M")).toEqual({ short: "DFP3", mark: 8, close: 4 });
    expect(defConAt(realScoring, "F")).toEqual({ short: "DFP3", mark: 6, close: 3 });
  });

  it("prices no DefCon for a keeper", () => {
    expect(defConAt(realScoring, "G")).toBeNull();
  });
});

describe("defConAt on a league that scores no DefCon", () => {
  it("answers nothing at any slot", () => {
    expect(["G", "D", "M", "F"].map((slot) => defConAt(rehearsalScoring, slot))).toEqual([null, null, null, null]);
  });
});

describe("defConPoints", () => {
  const rules = realScoring.rules;
  const codes = defConScored(realScoring.categories).map((category) => category.short);
  const once = (DFP: number, DFP3: number): DefConPeriod => ({ played: 1, counts: { DFP, DFP3 } });

  it("prices a defender's DFP match by match, never the season's sum at once", () => {
    expect(defConPoints(rules, codes, "D", [once(3, 20), once(5, 20), once(2, 20)])).toBe(3);
    // Nine over three matches is 1 + 1 + 1; priced as one count it would be 2.
    expect(defConPoints(rules, codes, "D", [once(3, 9), once(3, 9), once(3, 9)])).toBe(3);
  });

  it("prices a midfielder's and a forward's DFP3 at their own thresholds", () => {
    expect(defConPoints(rules, codes, "M", [once(12, 8), once(12, 11), once(12, 7)])).toBe(3);
    expect(defConPoints(rules, codes, "F", [once(12, 6), once(12, 9), once(12, 5)])).toBe(3);
  });

  it("prices the slot, not the man: the same counts pay a defender and a midfielder differently", () => {
    const counts = [once(5, 7)];
    expect(defConPoints(rules, codes, "D", counts)).toBe(2);
    expect(defConPoints(rules, codes, "M", counts)).toBe(0);
  });

  it("prices nothing in goal, where the rules carry no DefCon", () => {
    expect(defConPoints(rules, codes, "G", [once(5, 11)])).toBeNull();
  });

  it("skips a period he did not play, and says nothing for a man who played in none", () => {
    expect(defConPoints(rules, codes, "D", [{ played: 0, counts: { DFP: 0, DFP3: 0 } }, once(3, 9)])).toBe(1);
    expect(defConPoints(rules, codes, "D", [])).toBeNull();
    expect(defConPoints(rules, codes, "D", [{ played: 0, counts: { DFP: 0, DFP3: 0 } }])).toBeNull();
  });

  it("refuses a period that held two of his matches, or lacks a count", () => {
    expect(defConPoints(rules, codes, "D", [once(3, 9), { played: 2, counts: { DFP: 8, DFP3: 20 } }])).toBeNull();
    expect(defConPoints(rules, codes, "D", [{ played: 1, counts: { DFP3: 9 } }])).toBeNull();
  });
});

describe("bestDefConPoints", () => {
  const rules = realScoring.rules;
  const codes = defConScored(realScoring.categories).map((category) => category.short);
  const once = (DFP: number, DFP3: number): DefConPeriod => ({ played: 1, counts: { DFP, DFP3 } });

  it("pays a forward-midfielder at whichever position his counts earn more", () => {
    expect(bestDefConPoints(rules, codes, ["F", "M"], [once(0, 6), once(0, 9)])).toBe(3);
    expect(bestDefConPoints(rules, codes, ["M"], [once(0, 6), once(0, 9)])).toBe(1);
  });

  it("says nothing where no position prices DefCon or none is given", () => {
    expect(bestDefConPoints(rules, codes, ["G"], [once(5, 11)])).toBeNull();
    expect(bestDefConPoints(rules, codes, [], [once(5, 11)])).toBeNull();
  });
});
