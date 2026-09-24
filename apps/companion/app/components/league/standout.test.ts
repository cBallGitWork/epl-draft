import { describe, expect, it } from "vitest";
import { standoutCut, standoutCuts, standoutInk } from "./standout";

const repeat = (count: number, value: number) => Array.from({ length: count }, () => value);

// The pool board's rule: a sixth of the scored figures, and nothing under ten of them.
const POOL = { share: 1 / 6, floor: 10 } as const;
const pool = (values: (number | null)[]) => standoutCut(values, POOL.share, { floor: POOL.floor });

describe("standoutCut, over the scored figures (the pool board)", () => {
  it("lights the top band of a small-integer column and stops", () => {
    // Eight of sixty on 3 is inside a sixth; taking the 2s as well would be twenty-eight.
    expect(pool([...repeat(8, 3), ...repeat(20, 2), ...repeat(32, 1)])).toBe(3);
  });

  it("takes more than one value when both fit", () => {
    expect(pool([10, 9, 8, 7, ...repeat(56, 1)])).toBe(7);
  });

  it("takes a band whole or not at all", () => {
    expect(pool([...repeat(10, 5), ...repeat(15, 2), ...repeat(35, 1)])).toBe(5);
  });

  it("leaves a column dark when even its top value is common", () => {
    expect(pool([...repeat(30, 270), ...Array.from({ length: 70 }, (_, index) => 100 + index)])).toBeNull();
  });

  it("leaves a column dark when everybody agrees", () => {
    expect(pool(repeat(600, 3))).toBeNull();
  });

  it("lights nothing when a column has fewer figures than the floor", () => {
    expect(pool([1, 1, 1, 2])).toBeNull();
  });

  it("lights nothing when the column is all noughts", () => {
    expect(pool(repeat(600, 0))).toBeNull();
  });

  it("ignores the men on nought when sizing the population", () => {
    expect(pool([...repeat(490, 0), ...repeat(8, 3), ...repeat(52, 1)])).toBe(3);
  });

  it("passes nulls through as absences rather than noughts", () => {
    expect(pool([...repeat(8, 3), ...repeat(52, 1), null, null])).toBe(3);
  });
});

describe("standoutCut, over the men who played (a match board)", () => {
  const MATCH = { good: 1 / 5, best: 1 / 10 };

  it("lights three one-goal scorers among the sixteen who played, but crowns none of them", () => {
    const goals = [1, 1, 1, ...repeat(13, 0)];
    expect(standoutCuts(goals, MATCH, { of: 16 })).toEqual({ good: 1, best: null });
  });

  it("takes whole values at a time and stops before the share is spent", () => {
    // Room for three in yellow and one in orange; the three 9s would make six.
    expect(standoutCuts([16, 10, 10, 9, 9, 9, 7, 3], MATCH, { of: 16 })).toEqual({ good: 10, best: 16 });
  });

  it("lights nothing where the top value is common, and never a nought", () => {
    expect(standoutCut(repeat(11, 1), MATCH.good, { of: 16 })).toBeNull();
    expect(standoutCut([0, 0, null], MATCH.good, { of: 16 })).toBeNull();
  });
});

describe("standoutInk", () => {
  const cut = { good: 3, best: 5 };

  it("inks the best orange, the rest of the standouts yellow, and leaves the others alone", () => {
    expect(standoutInk(5, cut, "high")).toContain("text-peak");
    expect(standoutInk(3, cut, "high")).toContain("text-accent");
    expect(standoutInk(2, cut, "high")).toBe("");
  });

  it("inks a standout at the bad end red, whatever its size", () => {
    expect(standoutInk(5, cut, "low")).toContain("text-bad");
  });

  it("lights nothing in a column with no cut", () => {
    expect(standoutInk(99, { good: null, best: null }, "high")).toBe("");
    expect(standoutInk(99, undefined, "high")).toBe("");
  });
});
