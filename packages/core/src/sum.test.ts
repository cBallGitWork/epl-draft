import { describe, expect, it } from "vitest";
import { sumOf } from "./sum";

describe("sumOf", () => {
  it("adds up one figure off each row", () => {
    expect(sumOf([{ goals: 2 }, { goals: 0 }, { goals: 1 }], (row) => row.goals)).toBe(3);
  });

  it("is nought with nothing to add", () => {
    expect(sumOf([], () => 1)).toBe(0);
  });
});
