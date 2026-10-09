import { byCode } from "./byCode";
import type { IntelManifest } from "./types";

// Where a man played, as the raw cloud of touch points; untrusted provider data, parsed rather than asserted.

/** One man's touches in one match. `p` is flat and alternating, `[x, y, x, y, …]`; an odd length is corrupt. */
interface TouchFixture {
  fplFixtureId: number;
  p: number[];
}

/** One man's season of touches, split by fixture so a per-match filter is free. */
export interface TouchPlayer {
  /** FPL's season-stable code. */
  code: number;
  fixtures: TouchFixture[];
}

export interface IntelTouches {
  manifest: IntelManifest;
  players: TouchPlayer[];
}

/** One touch on SofaScore's axes, 0–100, every man attacking left to right in his own frame. Two sides on one
 *  pitch need the away cloud turned round: `{100 - x, 100 - y}`, both axes. */
export interface Touch {
  x: number;
  y: number;
}

/** Every man's touches by code, corrupt rows dropped: a cloud keyed on `NaN` merges several men into one map. */
export function touchIntel(touches: IntelTouches | null): Map<number, TouchPlayer> {
  return byCode(touches?.players, (player) => {
    const fixtures = (player.fixtures ?? []).filter(
      (fixture) =>
        Number.isInteger(fixture?.fplFixtureId) &&
        Array.isArray(fixture.p) &&
        fixture.p.length > 0 &&
        // An odd length lost a coordinate, so every pair after it has x and y swapped.
        fixture.p.length % 2 === 0,
    );
    return fixtures.length === 0 ? null : { code: player.code, fixtures };
  });
}

/** One man's touches as points, in one fixture or, with `fixture` null, the season. */
export function touchesOf(player: TouchPlayer | undefined, fixture: number | null): Touch[] {
  if (player === undefined) return [];
  const points: Touch[] = [];
  for (const each of player.fixtures) {
    if (fixture !== null && each.fplFixtureId !== fixture) continue;
    for (let n = 0; n + 1 < each.p.length; n += 2) {
      const x = each.p[n];
      const y = each.p[n + 1];
      // Refused per point, not per row: one stray coordinate must not cost the match's other touches.
      if (!inside(x) || !inside(y)) continue;
      points.push({ x, y });
    }
  }
  return points;
}

/** Where play happened, as one point, with the count that says how far to trust it. */
export interface TouchCentre {
  x: number;
  y: number;
  touches: number;
}

/** The average touch position of a cloud, one man's or a side's; pool the side's touches, never average its men.
 *  Matches SofaScore's own `average_x`/`average_y`. Null on an empty cloud, never a corner flag at (0, 0). */
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

/** The fixtures a man has touches in, by FPL fixture id; read off the file, so none is offered with nothing behind it. */
export function touchFixtures(player: TouchPlayer | undefined): number[] {
  if (player === undefined) return [];
  return player.fixtures.map((each) => each.fplFixtureId).sort((a, b) => a - b);
}
