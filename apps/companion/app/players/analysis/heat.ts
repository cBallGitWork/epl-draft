import type { Touch } from "@epl/core";

// Turning a man's touches into something a pitch can be shaded with.
//
// Craig, 10 Sep 2026: *"heatmaps are rough squares"*. They were, and the fix is
// not a finer grid — it is a KERNEL. The busiest player in the league has 414
// touches all season, so a 32x20 grid gives him under one touch per cell and a
// finer grid is a noisier one, not a smoother one. What makes the map smooth is
// the Gaussian blur the component puts over these cells; what makes it HONEST is
// that the cells are small enough that the blur is smoothing real structure
// rather than inventing it.
//
// **24 x 16, and the number is chosen against the blur rather than against the
// data.** On the 100x64 pitch that is cells of 4.17 x 4.00 — near enough square,
// which matters because an oblong cell blurs into an oblong smudge and reads as
// a direction the player never had. The blur's radius is a shade over half a
// cell, so a single touch spreads to about the area one player actually
// controls and two touches a cell apart merge. Finer and the blur has to grow to
// match, which costs the structure back; coarser and the squares survive it.
//
// **Normalised to the man's own busiest cell, so the map shows SHAPE.** A
// comparison where one man has 400 touches and the other 40 would otherwise
// draw the second as a blank pitch, which says "no data" when the truth is "less
// of it". Volume is a number and belongs in a caption; the pitch is for where.

/** How many cells across and down. See the file header — chosen against the
 *  blur, not against the data. */
const COLS = 24;
const ROWS = 16;

/** One shaded cell, in FRACTIONS of the pitch so this file never learns a
 *  viewBox. The component owns the geometry; this owns the arithmetic. */
export interface HeatCell {
  /** Left edge, 0–1 from the defensive end. */
  x: number;
  /** Top edge, 0–1. */
  y: number;
  /** How hot, 0–1, against this man's own busiest cell. */
  density: number;
}

/** The cell size, as a fraction of the pitch. Exported because the component
 *  draws rectangles of exactly this size and a second literal would be the two
 *  of them disagreeing. */
export const CELL = { width: 1 / COLS, height: 1 / ROWS };

/** A man's touches as shaded cells, busiest at 1, empty cells left out.
 *
 *  **Sparse on purpose.** A full grid is 384 rectangles per pitch and two
 *  pitches on a screen; five rounds in, a typical man fills perhaps sixty of
 *  them. Emitting the empty ones is 600-odd invisible nodes for the browser to
 *  blur, which is work with no picture at the end of it.
 *
 *  **The axis is not flipped.** SofaScore already publishes a man's touches
 *  running from his own goal to the one he attacks — measured 10 Sep 2026 across
 *  the whole export: keepers average x=11.0, centre-backs 36.4, full-backs 47.6,
 *  midfielders 48.8, attacking midfielders 58.4, forwards 61.8. A flip here
 *  would put every striker in his own box. */
export function heatCells(points: readonly Touch[]): HeatCell[] {
  if (points.length === 0) return [];

  const counts = new Map<number, number>();
  let busiest = 0;
  for (const point of points) {
    // `Math.min` and not a modulo: a touch on the line x=100 belongs in the last
    // column, and without the clamp it lands in a twenty-fifth that is never
    // drawn — the goal line is exactly where a striker's map is most crowded.
    const col = Math.min(COLS - 1, Math.floor((point.x / 100) * COLS));
    const row = Math.min(ROWS - 1, Math.floor((point.y / 100) * ROWS));
    const key = row * COLS + col;
    const next = (counts.get(key) ?? 0) + 1;
    counts.set(key, next);
    if (next > busiest) busiest = next;
  }

  const cells: HeatCell[] = [];
  for (const [key, count] of counts) {
    cells.push({
      x: (key % COLS) / COLS,
      y: Math.floor(key / COLS) / ROWS,
      density: count / busiest,
    });
  }
  return cells;
}

/** How hard the noise floor is pushed down before the peaks are pushed up.
 *
 *  **A curve and not a gain, and that is the whole difference between a map and
 *  a fog.** Five rounds in, a man has perhaps 90 touches over 60-odd cells, so
 *  his busiest cell holds three of them and a cell holding ONE is a third of the
 *  way up the scale. Multiplied by a flat gain, that single touch came out at
 *  full strength and every map was warm from one goal to the other — which is
 *  the "rough squares" complaint solved and replaced with a worse one.
 *
 *  It started at 1.8, which killed the fog and took most of the warmth with it
 *  (Craig, 10 Sep 2026: *"heat maps are a little faint"*). 1.25 keeps a
 *  one-in-three cell at under a third of the peak — still plainly the floor —
 *  while letting everything above it read. The blur radius came down at the same
 *  time, which is the other half of the same adjustment: a tighter kernel throws
 *  less of the intensity away, so less has to be added back. */
const FALLOFF = 1.25;

/** What the blur costs, put back.
 *
 *  A Gaussian spreads one cell over several times its own area, so a cell drawn
 *  at full strength reads at a fraction of it. Normalising BEFORE a blur
 *  normalises the wrong quantity; this is the correction, and it is deliberately
 *  small enough that only the very peak clips — a gain big enough to lift the
 *  floor flattens the top of every map into one shade. */
const BLUR_GAIN = 1.15;

/** The busiest area's opacity. Short of 1 because the mow bands under it are
 *  what say "pitch" — a solid block of colour reads as a chart that happens to
 *  be pitch-shaped. */
const HOTTEST = 0.95;

/** A cell's density as the opacity it is drawn at. */
export function shade(density: number): number {
  return Math.min(HOTTEST, BLUR_GAIN * density ** FALLOFF);
}
