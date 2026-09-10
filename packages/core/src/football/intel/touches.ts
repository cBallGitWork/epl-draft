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
export interface TouchFixture {
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
 *  The direction is NOT normalised in the export and that is deliberate — the
 *  consumer draws one man per pitch and is the only thing that knows which way
 *  he was playing. */
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
