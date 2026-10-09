import { describe, expect, it } from "vitest";
import type { Shot, TouchPlayer } from "@epl/core";
import { attackingSpan, seasonMaps } from "./maps";

const HIM = 1;
const MATE = 2;

function shot(code: number, extra: Partial<Shot> = {}): Shot {
  return {
    code,
    fplFixtureId: 10,
    minute: 30,
    x: 88,
    y: 50,
    xg: 0.1,
    xgot: null,
    outcome: "miss",
    situation: null,
    bodyPart: null,
    assistCode: null,
    pass: null,
    ...extra,
  };
}

const shots = new Map<number, Shot[]>([
  [HIM, [shot(HIM), shot(HIM, { outcome: "goal", assistCode: MATE })]],
  [MATE, [shot(MATE, { assistCode: HIM, pass: { x: 70, y: 20 } }), shot(MATE, { assistCode: HIM }), shot(MATE)]],
]);

const touches = new Map<number, TouchPlayer>([
  [
    HIM,
    {
      code: HIM,
      fixtures: [
        { fplFixtureId: 10, p: [40, 50, 60, 55] },
        { fplFixtureId: 11, p: [70, 30] },
      ],
    },
  ],
]);

describe("seasonMaps", () => {
  it("takes his own shots, and none of a teammate's", () => {
    const maps = seasonMaps(HIM, shots, touches, false);
    expect(maps.shots).toHaveLength(2);
    expect(maps.shots.every((each) => each.code === HIM)).toBe(true);
  });

  it("takes every shot he set up as his chances, with or without a pass to draw", () => {
    const maps = seasonMaps(HIM, shots, touches, false);
    expect(maps.chances).toHaveLength(2);
    expect(maps.chances.every((each) => each.code === MATE && each.assistCode === HIM)).toBe(true);
  });

  it("merges his touches across every fixture", () => {
    expect(seasonMaps(HIM, shots, touches, false).touches).toEqual([
      { x: 40, y: 50 },
      { x: 60, y: 55 },
      { x: 70, y: 30 },
    ]);
  });

  it("gives a keeper his touches and nothing else", () => {
    const maps = seasonMaps(HIM, shots, touches, true);
    expect(maps.shots).toEqual([]);
    expect(maps.chances).toEqual([]);
    expect(maps.touches).toHaveLength(3);
  });

  it("has nothing for a man the files never mention", () => {
    expect(seasonMaps(99, shots, touches, false)).toEqual({ shots: [], chances: [], touches: [] });
  });
});

describe("attackingSpan", () => {
  it("is the attacking half when everything is in it", () => {
    expect(attackingSpan([{ x: 88 }, { x: 60 }])).toEqual({ x: 50, width: 50 });
  });

  it("reaches back for a pass or a shot from his own half, rather than cutting it off", () => {
    const span = attackingSpan([{ x: 88 }, { x: 30 }]);
    expect(span.x).toBeLessThan(30);
    expect(span.x + span.width).toBe(100);
  });

  it("never reaches past his own goal line", () => {
    expect(attackingSpan([{ x: 1 }])).toEqual({ x: 0, width: 100 });
  });
});
