import { describe, expect, it } from "vitest";
import { depthIntel, depthLines, spotsOf } from "./depth";
import type { ClubDepth, DepthSlot } from "./depth";

const slot = (code: string, shirts: number, holders: number[]): DepthSlot => ({
  slot: code,
  label: code,
  shirts,
  holders: holders.map((c) => ({ code: c, share: 0.5 })),
});
const codes = (spots: { holders: { code: number }[] }[]) => spots.map((spot) => spot.holders.map((h) => h.code));

describe("spotsOf", () => {
  it("shows three men in line for a lone shirt", () => {
    expect(codes(spotsOf(slot("ST", 1, [1, 2, 3, 4])))).toEqual([[1, 2, 3]]);
  });

  it("deals a pair like a snake: first in one, second and third in the other, fourth under the first", () => {
    // Craig, 25 Sep 2026, in those words.
    expect(codes(spotsOf(slot("DM", 2, [1, 2, 3, 4, 5])))).toEqual([
      [1, 4],
      [2, 3],
    ]);
  });

  it("leaves a thin pair short rather than inventing a man", () => {
    expect(codes(spotsOf(slot("CM", 2, [7])))).toEqual([[7], []]);
  });
});

describe("depthLines", () => {
  const club = (slots: DepthSlot[]): ClubDepth => ({ formation: "", slots });

  it("draws a 4-2-3-1 from goal outward, left to right", () => {
    const lines = depthLines(
      club([slot("ST", 1, [9]), slot("GK", 1, [1]), slot("RB", 1, [2]), slot("LB", 1, [3]), slot("LCB", 1, [5]), slot("RCB", 1, [4]),
        slot("DM", 2, [6, 8]), slot("RW", 1, [7]), slot("AM", 1, [10]), slot("LW", 1, [11])]),
    );
    expect(lines.map((line) => line.map((spot) => spot.slot))).toEqual([
      ["GK"],
      ["LB", "LCB", "RCB", "RB"],
      ["DM", "DM"],
      ["LW", "AM", "RW"],
      ["ST"],
    ]);
  });

  it("sends the full-backs up in a back three, and the wingers up beside a lone striker", () => {
    const lines = depthLines(
      club([slot("GK", 1, [1]), slot("LCB", 1, [2]), slot("CCB", 1, [3]), slot("RCB", 1, [4]), slot("LB", 1, [5]), slot("RB", 1, [6]),
        slot("CM", 2, [7, 8]), slot("LW", 1, [9]), slot("ST", 1, [10]), slot("RW", 1, [11])]),
    );
    expect(lines.map((line) => line.map((spot) => spot.slot))).toEqual([
      ["GK"],
      ["LCB", "CCB", "RCB"],
      ["LB", "CM", "CM", "RB"],
      ["LW", "ST", "RW"],
    ]);
  });
});

describe("depthIntel", () => {
  it("drops a holder it cannot key, and reads a club by its label", () => {
    const manifest = { season: "26-27", gameweek: 6, exportedAt: "2026-09-25T13:45:10Z", rows: 1, sources: [] };
    const chart = depthIntel({
      manifest,
      clubs: { MCI: { formation: "4-2-3-1", slots: [{ slot: "ST", label: "Centre-forward", shirts: 1, holders: [{ code: Number.NaN, share: 1 }, { code: 223094, share: 0.94 }] }] } },
    });
    expect(chart.get("MCI")?.slots[0].holders.map((h) => h.code)).toEqual([223094]);
    expect(depthIntel(null).size).toBe(0);
  });
});
