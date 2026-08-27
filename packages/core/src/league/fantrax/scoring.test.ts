import { describe, expect, it } from "vitest";
import { categoryPoints } from "../scoring";
import realCategories from "./__fixtures__/scoringCategoriesReal.json";
import rehearsalCategories from "./__fixtures__/scoringCategoriesRehearsal.json";
import recorded from "./__fixtures__/scoringSystem.json";
import { mapScoringRules, mapScoringCategories} from "./scoring";
import type { RawScoringSystem } from "./scoring";

const rules = mapScoringRules(recorded as RawScoringSystem);

describe("mapScoringRules", () => {
  it("prices a clean sheet by position, from the league's own table", () => {
    // A defender's clean sheet is worth four and a midfielder's one. Nothing in
    // the app may assume that — it is a commissioner setting, and this is the
    // read that proves it comes from the payload.
    expect(rules).not.toBeNull();
    expect(categoryPoints(rules!, "CS", "D")).toBe(4);
    expect(categoryPoints(rules!, "CS", "M")).toBe(1);
  });

  it("prices a keeper from the keeper's table, not the outfielders'", () => {
    // "G" is absent from the outfield CS row, so reading the wrong table would
    // fall through to Default and quietly price a keeper's clean sheet at zero.
    expect(categoryPoints(rules!, "CS", "G")).toBe(4);
  });

  it("falls through to the wire's own Default column", () => {
    // Forwards are not listed in the CS row; the payload says what that means.
    expect(categoryPoints(rules!, "CS", "F")).toBe(0);
  });

  it("leaves ranges unparsed rather than guessing a number", () => {
    // Minutes are banded ("range1|59|1|NULL$60|90|1|NULL"). Nothing reads them,
    // because we do not score matches — so they are absent, not invented.
    expect(categoryPoints(rules!, "Min", "D")).toBeNull();
  });

  it("does not let an unreadable price fall through to Default", () => {
    // Goals against outfielders is banded for defenders ("range1|99|-1|2.0") and
    // flat zero for everyone else. Dropping the unreadable defender entry would
    // hand back Default's nought — a number from a different rule, reported as
    // if it were this one, which is the confident wrong answer principle 4 bans.
    expect(categoryPoints(rules!, "GAO", "D")).toBeNull();
    expect(categoryPoints(rules!, "GAO", "M")).toBe(0);
  });

  it("says nothing about a category the league does not score", () => {
    expect(categoryPoints(rules!, "KP", "M")).toBeNull();
  });

  it("reads the keeper's letter from the payload rather than assuming it", () => {
    expect(rules!.goaliePosition).toBe("G");
  });

  it("prices a keeper at nothing when Fantrax never named the keeper group", () => {
    // Fails to the outfield table's Default rather than to a wrong table — and
    // for a keeper that is null-or-Default, never four points we made up.
    const nameless = mapScoringRules({
      scoringCategories: { GOALIE: { CS: { Default: "points4" } }, NON_GOALIE: { CS: { D: "points4" } } },
    });
    expect(nameless!.goaliePosition).toBeNull();
    expect(categoryPoints(nameless!, "CS", "G")).toBeNull();
  });

  it("returns nothing at all when Fantrax describes no scoring", () => {
    expect(mapScoringRules(undefined)).toBeNull();
    expect(mapScoringRules({})).toBeNull();
  });
});

describe("mapScoringCategories", () => {
  // Both leagues' real `scoringCategorySettings`, recorded 27 Aug 2026. Two
  // fixtures because they answer different vocabularies, and a mapper written
  // against one of them proves nothing about the other.
  const rehearsal = mapScoringCategories(rehearsalCategories);
  const real = mapScoringCategories(realCategories);

  it("names a category the way getLiveScoringStats keys it", () => {
    expect(rehearsal["5010#6090"]).toEqual({ code: "G", name: "Goals" });
    expect(rehearsal["5020#6200"]).toEqual({ code: "Sv", name: "Saves" });
  });

  it("keys on group and category, never on the position", () => {
    // The one that matters. `statsMap.object2` always says `#-1`, and this
    // league lists outfield Goals only under 701/702/703 and outfield Clean
    // Sheets only under 702/703. Keying on the whole `scipId` would resolve
    // Minutes and Assists and lose exactly these two — which on screen looks
    // like a man who did not score rather than like a bug.
    const outfield = rehearsalCategories.scoringCategorySettings.find((g) => g.group.id === "5010");
    const positions = (id: string) =>
      (outfield?.configs ?? []).filter((c) => c.scoringCategory.id === id).map((c) => c.position.id);

    expect(positions("6090")).toEqual(["701", "702", "703"]);
    expect(positions("6249")).toEqual(["702", "703"]);
    expect(rehearsal["5010#6090"]?.code).toBe("G");
    expect(rehearsal["5010#6249"]?.code).toBe("CS");
  });

  it("reads the real league's own vocabulary, which is not the rehearsal one", () => {
    expect(real["5010#6181"]).toEqual({ code: "MP", name: "Midfielder Points" });
    expect(real["5010#6002"]).toEqual({
      code: "KP",
      name: "Key Passes (Assists on Shots)",
    });
    expect(real["5020#6689"]?.code).toBe("GKP");
    // Categories the rehearsal league scores and ours does not, and the reverse.
    expect(real["5010#6120"]).toBeUndefined();
    expect(rehearsal["5010#6181"]).toBeUndefined();
  });

  it("names nothing for a league that described no scoring", () => {
    expect(mapScoringCategories(undefined)).toEqual({});
    expect(mapScoringCategories({})).toEqual({});
  });

  it("leaves a category it cannot key out, rather than inventing one", () => {
    const named = mapScoringCategories({
      scoringCategorySettings: [
        { group: { id: "5010" }, configs: [{ scoringCategory: { name: "Nameless" } }] },
        { group: {}, configs: [{ scoringCategory: { id: "6090", shortName: "G" } }] },
      ],
    });
    expect(named).toEqual({});
  });
});
