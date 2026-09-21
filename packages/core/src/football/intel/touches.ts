import type { IntelManifest } from "./types";

// Where a man played, as the points themselves.
//
// **The raw cloud, and not the grid the contract first specified.** Two
// measurements settled it and both are in `docs/providers/intel-export.md`: the
// busiest player in the league has 414 touches all season, so a finer grid gives
// him under one touch per cell and resolution cannot buy smoothness — only a
// kernel can, and a kernel wants points. And the cloud is SMALLER than the grid
// it replaces: 45,244 points as flat integers is 291 KB against 0.78 MB for a
// dense 24x16 grid, in a directory whose every byte is baked into the bundle.
//
// **Untrusted, like any provider payload**, and parsed rather than asserted. It
// arrives as a committed file, which changes nothing about who wrote it.

/** One man's touches in one match.
 *
 *  **`p` is FLAT and alternating — `[x, y, x, y, …]`** — rather than an array of
 *  pairs. A `{x, y}` object per touch is 45,000 objects and roughly four times
 *  the bytes for the same numbers, and this file's whole argument is that the
 *  points are cheaper than the grid. An odd length is a corrupt row and the
 *  parser drops it. */
interface TouchFixture {
  fplFixtureId: number;
  p: number[];
}

/** One man's season of touches, split by fixture so a per-match filter is free —
 *  which is the other thing a season-aggregated grid could not do at any
 *  resolution. */
export interface TouchPlayer {
  /** FPL's season-stable code. */
  code: number;
  fixtures: TouchFixture[];
}

export interface IntelTouches {
  manifest: IntelManifest;
  players: TouchPlayer[];
}

/** One touch, on SofaScore's own axes: 0–100 in both, attacking left to right.
 *
 *  **Every man is in his OWN attacking frame, both sides of the same match.**
 *  Counted 11 Sep 2026 over fixtures 1–3: both keepers average x≈9–13 and both
 *  centre-forwards x≈53–65, so the export normalises per PLAYER and not per
 *  match. One man on one pitch is therefore free, which is what the comparison
 *  screen draws; but two sides on one pitch means the away cloud is facing the
 *  wrong way and must be turned round — `{100 - x, 100 - y}`, both axes, because
 *  turning a pitch about swaps the touchlines as well as the goals.
 *
 *  This docblock used to say the direction was "NOT normalised in the export",
 *  which read as though the two sides arrived in one match frame and only needed
 *  drawing. They do not, and a map built on that sentence would have put an away
 *  side's keeper in the opposite goal. */
export interface Touch {
  x: number;
  y: number;
}

/** Every man's touches, by code, with the corrupt rows left out.
 *
 *  Dropped rather than repaired, on `squadIntel`'s precedent: a cloud keyed on
 *  `NaN` collapses several men into one heat map, which is worse than a man
 *  being absent — one of those looks like an answer. */
export function touchIntel(touches: IntelTouches | null): Map<number, TouchPlayer> {
  const byCode = new Map<number, TouchPlayer>();
  if (touches === null) return byCode;
  for (const player of touches.players ?? []) {
    if (!Number.isInteger(player?.code)) continue;
    const fixtures = (player.fixtures ?? []).filter(
      (fixture) =>
        Number.isInteger(fixture?.fplFixtureId) &&
        Array.isArray(fixture.p) &&
        fixture.p.length > 0 &&
        // An odd length means a coordinate was lost, and every pair after the
        // loss is x and y swapped — a map that is wrong everywhere rather than
        // short by one touch.
        fixture.p.length % 2 === 0,
    );
    if (fixtures.length === 0) continue;
    byCode.set(player.code, { code: player.code, fixtures });
  }
  return byCode;
}

/** One man's touches as points, across every fixture or just one.
 *
 *  `fixture` of null is the season, which is what the screen opens on: five
 *  rounds in, one match is 46 touches and a shape a reader cannot read. */
export function touchesOf(player: TouchPlayer | undefined, fixture: number | null): Touch[] {
  if (player === undefined) return [];
  const points: Touch[] = [];
  for (const each of player.fixtures) {
    if (fixture !== null && each.fplFixtureId !== fixture) continue;
    for (let n = 0; n + 1 < each.p.length; n += 2) {
      const x = each.p[n];
      const y = each.p[n + 1];
      // Off-pitch coordinates are the one thing worth refusing per POINT rather
      // than per row: a stray 0 or a 300 is one touch, and dropping the man's
      // whole match for it would lose ninety good ones.
      if (!inside(x) || !inside(y)) continue;
      points.push({ x, y });
    }
  }
  return points;
}

/** Where play happened, as one point, with the count it was averaged over.
 *
 *  The count travels because it is the only thing that says how much to trust
 *  the point: a substitute's centroid comes off as few as two touches. */
export interface TouchCentre {
  x: number;
  y: number;
  touches: number;
}

/** The average touch position of a cloud — one man's, or a whole side's.
 *
 *  **One function for both, because a side's average touch position is the
 *  average of its TOUCHES and not the average of its men's averages.** The
 *  caller pools `touchesOf` across the eleven and hands the points over; a mean
 *  of means would weight a substitute's two touches like a centre-half's 153.
 *
 *  **This is SofaScore's own `average_x`/`average_y`, and it needed no export.**
 *  `docs/providers/intel-export.md` §3 asks the sister repo for
 *  `positions/26-27.json` and calls the average-position map blocked on it.
 *  Measured 11 Sep 2026 against `data/staging/sofascore/avg_positions.parquet`:
 *  that table is the mean of the same heat map this cloud is built from —
 *  identical point counts per man, and every cleanly-joined man in fixture 8
 *  agrees to within the half-unit the export's truncation to integers costs. The
 *  cloud covers 30 of 30 fixtures and 438 of 440 starters, where the table it
 *  would have been exported from covers the same 30.
 *
 *  **Null on an empty cloud rather than a point.** The centroid of nothing is
 *  (0, 0), which is a corner flag and looks like an answer — the same refusal
 *  `touchIntel` makes for a man with no usable code. */
export function averageTouchPosition(points: Touch[]): TouchCentre | null {
  if (points.length === 0) return null;
  let x = 0;
  let y = 0;
  for (const point of points) {
    x += point.x;
    y += point.y;
  }
  return { x: x / points.length, y: y / points.length, touches: points.length };
}

/** Whether a coordinate is on the pitch SofaScore says it is on. */
function inside(value: number): boolean {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 100;
}

/** Which fixtures a man has touches in, in the order they were played.
 *
 *  **Built from the file rather than from a list of its own**, which is the
 *  contract's rule for the map picker and the reason it holds here too: a
 *  fixture filter offering a match with nothing behind it is worse than a
 *  shorter filter. */
export function touchFixtures(player: TouchPlayer | undefined): number[] {
  if (player === undefined) return [];
  return player.fixtures.map((each) => each.fplFixtureId).sort((a, b) => a - b);
}
