import { describe, expect, it } from "vitest";
import { categoryPoints } from "../scoring";
import recorded from "./__fixtures__/scoringSystem.json";
import { mapScoringRules } from "./scoring";
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
