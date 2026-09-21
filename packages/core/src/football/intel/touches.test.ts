import { describe, expect, it } from "vitest";
import type { IntelTouches } from "./touches";
import { averageTouchPosition, touchFixtures, touchIntel, touchesOf } from "./touches";

/** The manifest every intel file carries. Nothing here reads it; it is present
 *  because the parser must survive a real payload rather than a trimmed one. */
const MANIFEST = {
  season: "26-27",
  gameweek: null,
  exportedAt: "2026-09-10T16:19:38.665443+00:00",
  rows: 4,
  sources: [],
};

function file(players: IntelTouches["players"]): IntelTouches {
  return { manifest: MANIFEST, players };
}

describe("touchIntel", () => {
  it("keys a man's touches on his code", () => {
    const map = touchIntel(file([{ code: 171314, fixtures: [{ fplFixtureId: 8, p: [14, 62] }] }]));
    expect(map.get(171314)?.fixtures).toHaveLength(1);
  });

  it("drops a row with an odd number of coordinates", () => {
    // A lost coordinate does not shorten the map by one touch — every pair after
    // it is x and y swapped, so the map is wrong everywhere. Better absent.
    const map = touchIntel(file([{ code: 1, fixtures: [{ fplFixtureId: 8, p: [14, 62, 52] }] }]));
    expect(map.has(1)).toBe(false);
  });

  it("drops a man with no usable code rather than keying him on NaN", () => {
    // Several men collapsing into one heat map is worse than a man being
    // absent: one of the two looks like an answer.
    const map = touchIntel(
      file([{ code: Number.NaN, fixtures: [{ fplFixtureId: 8, p: [1, 2] }] }]),
    );
    expect(map.size).toBe(0);
  });

  it("keeps the good fixtures of a man who has one bad one", () => {
    const map = touchIntel(
      file([
        {
          code: 1,
          fixtures: [
            { fplFixtureId: 8, p: [14, 62, 52] },
            { fplFixtureId: 9, p: [10, 20, 30, 40] },
          ],
        },
      ]),
    );
    expect(touchFixtures(map.get(1))).toEqual([9]);
  });

  it("survives a file that is not there", () => {
    expect(touchIntel(null).size).toBe(0);
  });
});

describe("touchesOf", () => {
  const map = touchIntel(
    file([
      {
        code: 1,
        fixtures: [
          { fplFixtureId: 8, p: [10, 20, 30, 40] },
          { fplFixtureId: 9, p: [50, 60] },
        ],
      },
    ]),
  );

  it("unflattens the alternating pairs", () => {
    expect(touchesOf(map.get(1), 8)).toEqual([
      { x: 10, y: 20 },
      { x: 30, y: 40 },
    ]);
  });

  it("takes the whole season when no fixture is asked for", () => {
    // What the screen opens on: five rounds in, one match is 46 touches and a
    // shape nobody can read.
    expect(touchesOf(map.get(1), null)).toHaveLength(3);
  });

  it("drops one off-pitch point without losing the match around it", () => {
    const stray = touchIntel(file([{ code: 2, fixtures: [{ fplFixtureId: 8, p: [10, 20, 300, 40, 50, 60] }] }]));
    expect(touchesOf(stray.get(2), 8)).toEqual([
      { x: 10, y: 20 },
      { x: 50, y: 60 },
    ]);
  });

  it("has nothing to say about a man who is not in the file", () => {
    expect(touchesOf(undefined, null)).toEqual([]);
    expect(touchFixtures(undefined)).toEqual([]);
  });
});

describe("averageTouchPosition", () => {
  it("is the centroid of the points, and says how many it averaged", () => {
    const centre = averageTouchPosition([
      { x: 10, y: 20 },
      { x: 30, y: 60 },
    ]);
    expect(centre).toEqual({ x: 20, y: 40, touches: 2 });
  });

  it("averages a side's touches rather than its men's averages", () => {
    // A substitute's two touches must not weigh what a centre-half's hundred
    // do — which is the whole reason this takes points and not centres.
    const heavy = Array.from({ length: 9 }, () => ({ x: 40, y: 50 }));
    const light = [{ x: 85, y: 50 }];
    expect(averageTouchPosition([...heavy, ...light])?.x).toBeCloseTo(44.5, 5);
  });

  it("answers null for an empty cloud rather than the corner flag", () => {
    // (0, 0) is a real place on this pitch, so a centre of nothing would draw
    // a man at the corner and look like an answer.
    expect(averageTouchPosition([])).toBeNull();
  });

  it("takes what `touchesOf` gives it, off-pitch points already refused", () => {
    const map = touchIntel({
      manifest: MANIFEST,
      players: [{ code: 1, fixtures: [{ fplFixtureId: 8, p: [10, 20, 300, 40, 30, 60] }] }],
    });
    expect(averageTouchPosition(touchesOf(map.get(1), 8))).toEqual({ x: 20, y: 40, touches: 2 });
  });
});
