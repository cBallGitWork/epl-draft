import { describe, expect, it } from "vitest";
import { normalizeBin } from "./cargo";

const man = { name: "Jay da Silva", code: 461358, slot: "D", club: "COV", points: 12, minutes: 90 };

describe("normalizeBin", () => {
  it("keeps a side as the desk printed it, field by field", () => {
    const bin = normalizeBin({ shape: "4-4-2", total: 81, xi: [{ ...man, verdict: "invented" }], bench: [], keyStats: [{ label: "Most shots", value: "Rashford 6" }] });
    expect(bin).toEqual({ shape: "4-4-2", total: 81, xi: [man], bench: [], keyStats: [{ label: "Most shots", value: "Rashford 6" }] });
  });

  it("refuses a man with no real code and a stat with no value, and a side with nobody in it", () => {
    const bin = normalizeBin({ shape: "4-4-2", total: 81, xi: [man, { ...man, code: -1 }, { ...man, points: "12" }], keyStats: [{ label: "Top xG", value: "" }] });
    expect(bin?.xi).toEqual([man]);
    expect(bin?.bench).toEqual([]);
    expect(bin?.keyStats).toEqual([]);
    expect(normalizeBin({ shape: "4-4-2", total: 81, xi: [] })).toBeUndefined();
    expect(normalizeBin(null)).toBeUndefined();
  });
});
