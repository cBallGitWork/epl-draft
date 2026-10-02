import { describe, expect, it } from "vitest";
import type { ScoringRules } from "@epl/core";
import { squadDefcon } from "./defcon";

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

describe("a squad's DefCon points", () => {
  it("prices each man at the slot he fills, period by period", () => {
    const periods = [
      [["def", 1, { DFP: 3, DFP3: 9 }], ["mid", 1, { DFP: 4, DFP3: 11 }]],
      [["def", 1, { DFP: 6, DFP3: 12 }], ["mid", 1, { DFP: 2, DFP3: 8 }]],
    ] as const;
    expect(squadDefcon(rules, codes, { def: "D", mid: "M", keeper: "G" }, periods.map((lines) => lines.map(([id, played, counts]) => [id, played, { ...counts }])))).toEqual({
      def: 3,
      mid: 3,
      keeper: null,
    });
  });

  it("says nothing for anybody when a period could not be read, rather than counting it a blank week", () => {
    expect(squadDefcon(rules, codes, { def: "D" }, null)).toEqual({ def: null });
  });
});
