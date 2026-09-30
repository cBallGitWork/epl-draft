import { describe, expect, it } from "vitest";
import { minimumsOf } from "./minimums";

const file = {
  leagues: {
    read: { minimumsInForce: true, positions: [{ shortName: "D", minActive: 3 }, { shortName: "M", minActive: 2 }, { shortName: "G", minActive: 1 }, { shortName: "X", minActive: 0 }] },
    off: { minimumsInForce: false, positions: [{ shortName: "D", minActive: 3 }] },
    unread: {},
  },
};

describe("minimumsOf", () => {
  it("reads each position's floor, and leaves out a floor of nought", () => {
    expect(minimumsOf(file, "read")).toEqual({ D: 3, M: 2, G: 1 });
  });

  it("has no floor where the commissioner switched minimums off, the page was unreadable, or the league was never read", () => {
    expect(minimumsOf(file, "off")).toBeNull();
    expect(minimumsOf(file, "unread")).toBeNull();
    expect(minimumsOf(file, "missing")).toBeNull();
  });
});
