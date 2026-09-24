import { describe, expect, it } from "vitest";
import { byFigure } from "./order";

describe("byFigure", () => {
  it("orders two figures the way the column runs", () => {
    expect(byFigure(3, 5, true)).toBeGreaterThan(0);
    expect(byFigure(3, 5, false)).toBeLessThan(0);
  });

  it("sinks an absent figure whichever way the column runs", () => {
    for (const descending of [true, false]) {
      expect(byFigure(null, 5, descending)).toBe(1);
      expect(byFigure(5, null, descending)).toBe(-1);
    }
  });

  it("calls a tie, and two absences, even, for the caller to break", () => {
    expect(byFigure(4, 4, true)).toBe(0);
    expect(byFigure(null, null, false)).toBe(0);
  });

  it("orders words as words", () => {
    expect(byFigure("Arsenal", "Brighton", false)).toBeLessThan(0);
  });
});
