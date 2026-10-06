import { describe, expect, it } from "vitest";
import { ASSIST, ASSISTS_TOTAL, DEFENSIVE_POINTS, DEFENSIVE_POINTS_3, GOALS, KEEPER_POINTS, firstScored } from "./categoryNames";
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
      // Sentence case past the first word: Fantrax's captions are Title Case.
      expect(name.split(" ").slice(1).every((word) => word === word.toLowerCase()), category.code).toBe(true);
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
  // DefCon's two counts carry our own names on every board.
  it("names and heads DefCon's two counts as ours, with what each counts in the key", () => {
    expect(wordsFor(DEFENSIVE_POINTS)).toEqual({ name: "DefCon", key: "DefCon: tackles won, interceptions and blocks", head: "DC" });
    expect(wordsFor(DEFENSIVE_POINTS_3)).toMatchObject({ name: "DefCon+", head: "DC+" });
    expect(wordsFor(DEFENSIVE_POINTS_3).key).toMatch(/^DefCon\+: .*clearances and recoveries$/);
  });

  it("heads every other category by Fantrax's code", () => {
    expect(wordsFor(GOALS).head).toBe("G");
    expect(wordsFor(KEEPER_POINTS).head).toBe("GKP");
  });
});

describe("heads", () => {
  const both = [...realCategories, ...rehearsalCategories];
  const heads = new Map(both.map((category) => [category.code, wordsOf(category).head]));

  it("heads a league's DefCon by meaning, and a category it does not know by the league's own code", () => {
    expect([named(realCategories, "DFP").head, named(realCategories, "DFP3").head]).toEqual(["DC", "DC+"]);
    expect(wordsOf({ code: "Pen", name: "Penalty ", longCode: null }).head).toBe("Pen");
  });

  it("never gives two of either league's categories one head, nor one another's code", () => {
    expect(new Set(heads.values()).size).toBe(heads.size);
    for (const [code, head] of heads) if (head !== code) expect([...heads.keys()], head).not.toContain(head);
  });
});
