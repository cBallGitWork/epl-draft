import { describe, expect, it } from "vitest";
import real from "./fantrax/__fixtures__/leagueInfoScoringReal.json";
import { mapScoringRules, type RawScoringSystem } from "./fantrax/scoring";
import { returnPoints } from "./scoring";

const rules = mapScoringRules(real.scoringSystem as RawScoringSystem)!;

describe("returnPoints", () => {
  it("prices a defender's goal, assist and clean sheet by the league's own table", () => {
    expect(returnPoints({ G: 1, AT: 1, CS: 1 }, rules, "D")).toEqual({ attacking: 9, cleanSheet: 4 });
  });

  it("gives a forward nothing for a clean sheet, and a keeper ten for a goal", () => {
    expect(returnPoints({ G: 1, CS: 1 }, rules, "F")).toEqual({ attacking: 4, cleanSheet: 0 });
    expect(returnPoints({ G: 1, CS: 1 }, rules, "G")).toEqual({ attacking: 10, cleanSheet: 4 });
  });

  it("ignores a count the league does not score, and a count it did not send", () => {
    expect(returnPoints({ G: 1, A: 2, AF: 1 }, rules, "M")).toEqual({ attacking: 5, cleanSheet: 0 });
    expect(returnPoints({}, rules, "M")).toEqual({ attacking: 0, cleanSheet: 0 });
  });
});
