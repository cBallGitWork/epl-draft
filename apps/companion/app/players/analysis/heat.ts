import type { Touch } from "@epl/core";

// A man's touches as shaded cells for a pitch, which the component blurs (Craig, 10 Sep 2026: "heatmaps are rough
// squares"). Scaled to his own crowded cells, so the map shows shape and the caption carries volume.

/** Cells across and down: near-square on the 100x64 pitch, so the blur does not smear a direction. */
const COLS = 24;
const ROWS = 16;

/** One shaded cell, in fractions of the pitch: the component owns the geometry. */
interface HeatCell {
  /** Left edge, 0–1 from the defensive end. */
  x: number;
  /** Top edge, 0–1. */
  y: number;
  /** How hot, 0–1, against this man's own 90th-percentile cell. */
  density: number;
}

/** The cell size, as a fraction of the pitch, for the component's rectangles. */
export const CELL = { width: 1 / COLS, height: 1 / ROWS };

/** A man's touches as shaded cells, his crowded ones at 1, empty ones left out. Not flipped: SofaScore already runs
 *  from his own goal to the one he attacks. */
export function heatCells(points: readonly Touch[]): HeatCell[] {
  if (points.length === 0) return [];

  const counts = new Map<number, number>();
  for (const point of points) {
    // Clamped: a touch on the line x=100 belongs in the last column, not one never drawn.
    const col = Math.min(COLS - 1, Math.floor((point.x / 100) * COLS));
    const row = Math.min(ROWS - 1, Math.floor((point.y / 100) * ROWS));
    const key = row * COLS + col;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  // Scaled to his crowded cells rather than his one busiest, so a lone spike cannot wash the map out.
  const ranked = [...counts.values()].sort((a, b) => a - b);
  const full = ranked[Math.min(ranked.length - 1, Math.floor(ranked.length * SATURATE))];

  const cells: HeatCell[] = [];
  for (const [key, count] of counts) {
    cells.push({
      x: (key % COLS) / COLS,
      y: Math.floor(key / COLS) / ROWS,
      density: Math.min(1, count / full),
    });
  }
  return cells;
}

/** The share of his touched cells drawn below full strength (Craig, 24 Sep 2026: "Heat can be less subtle"). */
const SATURATE = 0.9;

/** A curve, not a gain: pushes a one-touch cell down to the floor so the map is not a fog. Tuned with `PlayerMap`'s blur. */
const FALLOFF = 1.25;

/** What the blur spreads away, put back; small enough that only the very peak clips. */
const BLUR_GAIN = 1.15;

/** The busiest area's opacity, short of 1 so the mow bands still say "pitch". */
const HOTTEST = 0.95;

/** A cell's density as the opacity it is drawn at. */
export function shade(density: number): number {
  return Math.min(HOTTEST, BLUR_GAIN * density ** FALLOFF);
}
