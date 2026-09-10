import { describe, expect, it } from "vitest";
import { CELL, heatCells, shade } from "./heat";

describe("heatCells", () => {
  it("has nothing to shade for a man with no touches", () => {
    expect(heatCells([])).toEqual([]);
  });

  it("emits only the cells that were touched", () => {
    // Sparse on purpose: a full grid is 384 rectangles per pitch, and five
    // rounds in a typical man fills perhaps sixty of them.
    expect(heatCells([{ x: 50, y: 50 }])).toHaveLength(1);
  });

  it("normalises to the man's own busiest cell", () => {
    // Shape, not volume — otherwise a man with a tenth of the touches draws as
    // a blank pitch, which says "no data" when the truth is "less of it".
    const cells = heatCells([
      { x: 10, y: 10 },
      { x: 10, y: 10 },
      { x: 90, y: 90 },
    ]);
    expect(Math.max(...cells.map((c) => c.density))).toBe(1);
    expect(Math.min(...cells.map((c) => c.density))).toBeCloseTo(0.5);
  });

  it("puts a touch on the far goal line in the last column, not off the grid", () => {
    // The clamp is load-bearing: the goal line is exactly where a striker's map
    // is most crowded, and without it those touches land in a 25th column that
    // is never drawn.
    const [cell] = heatCells([{ x: 100, y: 100 }]);
    expect(cell.x).toBeCloseTo(1 - CELL.width);
    expect(cell.y).toBeCloseTo(1 - CELL.height);
  });

  it("puts a touch in his own goal in the first cell", () => {
    expect(heatCells([{ x: 0, y: 0 }])[0]).toEqual({ x: 0, y: 0, density: 1 });
  });

  it("merges touches that fall in one cell", () => {
    const cells = heatCells([
      { x: 50, y: 50 },
      { x: 51, y: 50 },
    ]);
    expect(cells).toHaveLength(1);
  });

  it("keeps cells near enough square, so a blur cannot invent a direction", () => {
    // 4.17 x 4.00 on the 100x64 pitch. An oblong cell blurs into an oblong
    // smudge and reads as a direction the player never had.
    const ratio = (CELL.width * 100) / (CELL.height * 64);
    expect(ratio).toBeGreaterThan(0.9);
    expect(ratio).toBeLessThan(1.1);
  });
});

describe("shade", () => {
  it("keeps the busiest area short of solid", () => {
    // The mow bands under it are what say "pitch".
    expect(shade(1)).toBeLessThan(1);
    expect(shade(1)).toBeGreaterThan(0.8);
  });

  it("pushes a lone touch well down rather than drawing it like a peak", () => {
    // The fault this replaced: five rounds in, a man's busiest cell holds three
    // touches, so a cell holding ONE is a third of the way up the scale. A flat
    // gain drew it at full strength and every map was warm goal to goal.
    expect(shade(1 / 3)).toBeLessThan(0.25);
  });

  it("keeps the top bands apart instead of clipping them together", () => {
    // Two thirds and full must be visibly different, or the peak of the map has
    // no shape inside it.
    expect(shade(1) - shade(2 / 3)).toBeGreaterThan(0.15);
  });

  it("draws nothing for nothing", () => {
    expect(shade(0)).toBe(0);
  });

  it("never exceeds the ceiling however hot the cell", () => {
    expect(shade(5)).toBe(shade(1));
  });
});
