import { describe, expect, it } from "vitest";
import type { ScoringRules } from "@epl/core";
import { defconBy } from "./defcon";
import type { PeriodLine } from "./statsLeague";

// The real league's DefCon, as Craig's table of 29 Sep gives it: DFP 3 → 1, 5+ → 2 at the back; DFP3 8 → 1, 11+ → 2 in midfield.
const tiers = (one: number, two: number) => ({
  bands: [
    { from: one, to: two - 1, points: 1, every: null },
    { from: two, to: two, points: 2, every: null },
  ],
  cumulative: false,
});
const rules: ScoringRules = {
  goalie: {},
  outfield: { DFP: { D: tiers(3, 5), Default: 0 }, DFP3: { M: tiers(8, 11), Default: 0 } },
  goaliePosition: "G",
};
const codes = ["DFP", "DFP3"];

describe("DefCon points for a set of men", () => {
  it("prices each man at the slot he fills, period by period", () => {
    const periods = [
      [["def", 1, { DFP: 3, DFP3: 9 }], ["mid", 1, { DFP: 4, DFP3: 11 }]],
      [["def", 1, { DFP: 6, DFP3: 12 }], ["mid", 1, { DFP: 2, DFP3: 8 }]],
    ] as const;
    expect(defconBy(rules, codes, { def: ["D"], mid: ["M"], keeper: ["G"] }, periods.map((lines) => lines.map(([id, played, counts]) => [id, played, { ...counts }])))).toEqual({
      def: 3,
      mid: 3,
      keeper: null,
    });
  });

  it("prices a man at whichever of his positions pays more, and a man given none at nothing", () => {
    const periods: PeriodLine[][] = [[["both", 1, { DFP: 0, DFP3: 8 }]]];
    expect(defconBy(rules, codes, { both: ["M", "D"], none: [] }, periods)).toEqual({ both: 1, none: null });
  });

  it("says nothing for anybody when a period could not be read, rather than counting it a blank week", () => {
    expect(defconBy(rules, codes, { def: ["D"] }, null)).toEqual({ def: null });
  });
});
