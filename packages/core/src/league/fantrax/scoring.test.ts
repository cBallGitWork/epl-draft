import { describe, expect, it } from "vitest";
import { categoryPoints, pointsFor } from "../scoring";
import realInfo from "./__fixtures__/leagueInfoScoringReal.json";
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

  it("reads no range off the string alone, which cannot say whether its bands stack", () => {
    // This recording carries no settings mirror, so "range1|59|1|NULL$60|90|1|NULL" stays unpriced.
    expect(categoryPoints(rules!, "Min", "D")).toBeNull();
    expect(pointsFor(rules!, "Min", "D", 90)).toBeNull();
  });

  it("does not let an unreadable price fall through to Default", () => {
    // Defenders' goals against is banded and unread here; Default's nought is another rule.
    expect(pointsFor(rules!, "GAO", "D", 2)).toBeNull();
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

// The real league's getLeagueInfo on 1 Oct 2026, which pays exactly Craig's table of 29 Sep.
describe("pointsFor on the real league's table", () => {
  const real = mapScoringRules(realInfo.scoringSystem as RawScoringSystem)!;
  const at = (category: string, slot: string, counts: number[]) => counts.map((n) => pointsFor(real, category, slot, n));

  it("pays a goal 10 in goal, 6 at the back, 5 in midfield and 4 up front", () => {
    expect(["G", "D", "M", "F"].map((slot) => pointsFor(real, "G", slot, 1))).toEqual([10, 6, 5, 4]);
    expect(pointsFor(real, "G", "M", 2)).toBe(10);
  });

  it("pays an assist 3 at every slot", () => {
    expect(["G", "D", "M", "F"].map((slot) => pointsFor(real, "AT", slot, 1))).toEqual([3, 3, 3, 3]);
  });

  it("pays a clean sheet 4 to a keeper or defender, 1 to a midfielder and nothing to a forward", () => {
    expect(["G", "D", "M", "F"].map((slot) => pointsFor(real, "CS", slot, 1))).toEqual([4, 4, 1, 0]);
  });

  it("takes 1 for every two conceded from a keeper or defender, and nothing from anyone else", () => {
    expect(at("GA", "G", [0, 1, 2, 3, 4, 5])).toEqual([0, 0, -1, -1, -2, -2]);
    expect(at("GAO", "D", [1, 2, 4])).toEqual([0, -1, -2]);
    expect(at("GAO", "M", [4])).toEqual([0]);
  });

  it("pays minutes 1 for 1 to 59 and 2 for 60 or more, keeper and outfielder alike", () => {
    expect(at("Min", "D", [0, 1, 59, 60, 90, 94])).toEqual([0, 1, 1, 2, 2, 2]);
    expect(at("Min", "G", [0, 1, 59, 60, 90, 94])).toEqual([0, 1, 1, 2, 2, 2]);
  });

  it("stacks cumulative bands and pays non-cumulative ones once, as the mirror says", () => {
    // Outfield minutes are 1 and 1 stacked, the keeper's 1 or 2: the strings alone would pay 1 for 90.
    expect(real.outfield.Min.Default).toMatchObject({ cumulative: true, bands: [{ points: 1 }, { points: 1 }] });
    expect(real.goalie.Min.Default).toMatchObject({ cumulative: false, bands: [{ points: 1 }, { points: 2 }] });
  });

  it("pays a keeper 5 for a penalty saved and 1 for every 3 keeper points", () => {
    expect(pointsFor(real, "PKS", "G", 1)).toBe(5);
    expect(at("GKP", "G", [2, 3, 5, 6, 9])).toEqual([0, 1, 1, 2, 3]);
  });

  it("docks a yellow 1, a red 3, and a missed penalty or an own goal 2", () => {
    for (const slot of ["G", "D", "M", "F"]) {
      expect(["YC", "RC", "PKM", "OG"].map((category) => pointsFor(real, category, slot, 1))).toEqual([-1, -3, -2, -2]);
    }
    expect(pointsFor(real, "YC", "M", 0)).toBe(0);
  });

  it("pays a defender's defensive points 1 at 3 and 2 from 5", () => {
    expect(at("DFP", "D", [2, 3, 4, 5, 12])).toEqual([0, 1, 1, 2, 2]);
    expect(at("DFP", "M", [12])).toEqual([0]);
  });

  it("pays a midfielder's CBIRT 1 at 8 and 2 from 11, and a forward's 1 at 6 and 2 from 9", () => {
    expect(at("DFP3", "M", [7, 8, 10, 11, 20])).toEqual([0, 1, 1, 2, 2]);
    expect(at("DFP3", "F", [5, 6, 8, 9, 20])).toEqual([0, 1, 1, 2, 2]);
    expect(at("DFP3", "D", [20])).toEqual([0]);
  });

  it("prices a flat category per unit and a banded one only through pointsFor", () => {
    expect(categoryPoints(real, "G", "D")).toBe(6);
    expect(categoryPoints(real, "Min", "D")).toBeNull();
  });

  it("refuses a band it cannot read rather than pricing part of it", () => {
    const banded = (config: object) =>
      mapScoringRules({
        scoringCategories: { NON_GOALIE: { Min: { Default: "range1|59|1|NULL" } } },
        scoringCategorySettings: [{ group: { code: "SOCCER_NON_GOALIE" }, configs: [{ scoringCategory: { shortName: "Min" }, position: { shortName: "Default" }, ...config }] }],
      })!;
    const band = { range: { start: 1, end: 59 }, points: 1 };
    expect(pointsFor(banded({ rangeType: "PER_GAME", cumulative: false, ranges: [band] }), "Min", "D", 30)).toBe(1);
    expect(pointsFor(banded({ rangeType: "PER_PERIOD", cumulative: false, ranges: [band] }), "Min", "D", 30)).toBeNull();
    expect(pointsFor(banded({ rangeType: "PER_GAME", ranges: [band] }), "Min", "D", 30)).toBeNull();
    expect(pointsFor(banded({ rangeType: "PER_GAME", cumulative: false, ranges: [{ range: { start: 1 }, points: 1 }] }), "Min", "D", 30)).toBeNull();
  });
});

describe("mapScoringCategories", () => {
  // Both leagues' real `scoringCategorySettings`, recorded 27 Aug 2026. Two
  // fixtures because they answer different vocabularies, and a mapper written
  // against one of them proves nothing about the other.
  const rehearsal = mapScoringCategories(rehearsalCategories);
  const real = mapScoringCategories(realCategories);

  it("names a category the way getLiveScoringStats keys it", () => {
    expect(rehearsal["5010#6090"]).toEqual({ code: "G", name: "Goals", longCode: "INDIVIDUAL_GOALS" });
    expect(rehearsal["5020#6200"]).toEqual({ code: "Sv", name: "Saves", longCode: "INDIVIDUAL_SAVES" });
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
    expect(real["5010#6181"]).toEqual({ code: "MP", name: "Midfielder Points", longCode: "INDIVIDUAL_MIDFIELDER_POINTS" });
    expect(real["5010#6002"]).toEqual({
      code: "KP",
      name: "Key Passes (Assists on Shots)",
      longCode: "INDIVIDUAL_ASSISTS_ON_SHOTS",
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

  it("leaves a category Fantrax did not name unnamed, rather than printing its id", () => {
    // `5010#6090` on a player card looks like a category called 6090. A missing
    // row is absent from a list that never claimed to be complete.
    expect(
      mapScoringCategories({
        scoringCategorySettings: [
          { group: { id: "5010" }, configs: [{ scoringCategory: { id: "6090" } }] },
        ],
      }),
    ).toEqual({});
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
