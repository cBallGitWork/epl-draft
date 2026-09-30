import { describe, expect, it } from "vitest";
import type { Shot } from "@epl/core";
import { drawOrder, markRadius, markReach, passLine } from "./shotGeometry";
import { toBoxY } from "./pitchBox";

const shot = (x: number, y: number, xg: number | null, outcome: Shot["outcome"] = "miss") => ({ x, y, xg, outcome });

describe("markRadius", () => {
  it("grows with the square root of xG, so area carries the chance", () => {
    const small = markRadius(0.05) - markRadius(0);
    const big = markRadius(0.2) - markRadius(0);
    expect(big / small).toBeCloseTo(2, 5);
  });

  it("stops growing at the penalty's xG", () => {
    expect(markRadius(0.96)).toBe(markRadius(0.8));
  });

  it("draws a shot with no xG at the plain size rather than the smallest", () => {
    expect(markRadius(null)).toBeGreaterThan(markRadius(0));
  });
});

describe("passLine", () => {
  it("stops at the edge of the shot's mark, not its centre", () => {
    const struck = shot(90, 50, 0.3);
    const line = passLine({ x: 60, y: 50 }, struck);
    expect(line).not.toBeNull();
    expect(line?.x1).toBe(60);
    expect(line?.x2).toBeCloseTo(90 - markReach(struck), 5);
    expect(line?.y2).toBeCloseTo(toBoxY(50), 5);
  });

  it("measures in the pitch's drawn units, where y is squashed", () => {
    const struck = shot(90, 20, 0.1, "save");
    const line = passLine({ x: 90, y: 80 }, struck);
    const gap = line === null ? 0 : Math.hypot(90 - line.x2, toBoxY(20) - line.y2);
    expect(gap).toBeCloseTo(markReach(struck), 5);
    expect(line?.x2).toBeCloseTo(90, 5);
  });

  it("draws no line when the pass started inside the mark", () => {
    const struck = shot(90, 50, 0.5);
    expect(passLine({ x: 90.5, y: 50.5 }, struck)).toBeNull();
  });
});

describe("drawOrder", () => {
  it("draws bigger chances first so a smaller mark is never buried under one", () => {
    const shots = [shot(90, 50, 0.05), shot(90, 50, 0.6), shot(90, 50, 0.2)];
    expect(drawOrder(shots)).toEqual([1, 2, 0]);
  });

  it("puts a goal over a miss of the same size", () => {
    const shots = [shot(90, 50, 0.1, "goal"), shot(90, 50, 0.1, "save"), shot(90, 50, 0.1, "block")];
    expect(drawOrder(shots)).toEqual([2, 1, 0]);
  });

  it("keeps every shot", () => {
    const shots = [shot(1, 1, null), shot(2, 2, 0.4, "goal"), shot(3, 3, 0.02), shot(4, 4, 0.4)];
    expect([...drawOrder(shots)].sort()).toEqual([0, 1, 2, 3]);
  });
});
