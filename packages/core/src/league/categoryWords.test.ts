import { describe, expect, it } from "vitest";
import { ASSIST, ASSISTS_TOTAL, DEFENSIVE_POINTS, DEFENSIVE_POINTS_3, KEEPER_POINTS, firstScored } from "./categoryNames";
import { wordsFor, wordsOf } from "./categoryWords";
import { mapLeagueInfo } from "./fantrax/map";
import real from "./fantrax/__fixtures__/leagueInfoScoringReal.json";
import rehearsal from "./fantrax/__fixtures__/leagueInfoScoringRehearsal.json";

// Both leagues' getLeagueInfo as they stood on 1 Oct 2026: the real league scores AT and GKP, the rehearsal A, AF and Sv.
const realCategories = Object.values(mapLeagueInfo(real).scoringCategories);
const rehearsalCategories = Object.values(mapLeagueInfo(rehearsal).scoringCategories);
const named = (categories: typeof realCategories, code: string) => wordsOf(categories.find((each) => each.code === code)!);

describe("wordsOf", () => {
  it("names each league's assists Assists, under AT in the real league and A in the rehearsal", () => {
    expect(named(realCategories, "AT").name).toBe("Assists");
    expect(named(rehearsalCategories, "A").name).toBe("Assists");
    expect(wordsFor(firstScored(mapLeagueInfo(real).scoringCategories, ASSIST)!)).toEqual(named(realCategories, "AT"));
  });

  it("keeps the key lines apart where a board shows the total beside its parts", () => {
    const keys = [named(realCategories, "AT").key, named(rehearsalCategories, "A").key, named(rehearsalCategories, "AF").key];
    expect(new Set(keys).size).toBe(3);
  });

  it("never calls the real league's keeper category saves", () => {
    expect(named(realCategories, "GKP").name).toBe("Keeper actions");
    expect(named(realCategories, "GKP").key).not.toMatch(/^Saves/);
    expect(named(rehearsalCategories, "Sv").name).toBe("Saves");
  });

  it("gives every category either league scores plain words, never Fantrax's caption", () => {
    for (const category of [...realCategories, ...rehearsalCategories]) {
      const { name, key } = wordsOf(category);
      // Sentence case past the first word, but for the position letters: Fantrax's captions are Title Case.
      expect(name.split(" ").slice(1).every((word) => word === word.toLowerCase() || /^\((DEF|MID\/FWD)\)$/.test(word)), category.code).toBe(true);
      expect(`${name} ${key}`, category.code).not.toMatch(/\((Total|Official|Fantasy)\)|Points|On Field|Outfielders|Kick/);
    }
  });

  it("goes by the long code where a league carried one, whatever its short code", () => {
    expect(wordsOf({ code: "XX", name: "Assists (Total)", longCode: ASSISTS_TOTAL.code }).name).toBe("Assists");
  });

  it("goes by the short code where the read carried no long one", () => {
    expect(wordsOf({ code: "GKP", name: "", longCode: null })).toEqual(wordsFor(KEEPER_POINTS));
  });

  it("falls back to the league's own name, then its code, for a category it does not know", () => {
    expect(wordsOf({ code: "Pen", name: "Penalty ", longCode: null }).name).toBe("Penalty");
    expect(wordsOf({ code: "Pen", name: "", longCode: null }).key).toBe("Pen");
  });
});

describe("wordsFor", () => {
  it("names DefCon's two counts by whom FPL's DefCon pays on each, with what each counts in the key", () => {
    expect(wordsFor(DEFENSIVE_POINTS)).toEqual({ name: "DefCon (DEF)", key: "DefCon (DEF): tackles won, interceptions and blocks" });
    expect(wordsFor(DEFENSIVE_POINTS_3).name).toBe("DefCon (MID/FWD)");
    expect(wordsFor(DEFENSIVE_POINTS_3).key).toMatch(/clearances and recoveries$/);
  });
});
