import { describe, expect, it } from "vitest";
import {
  type IntelProjections,
  type ProjectedPlayer,
  nextGameweeks,
  projectedTotal,
  projectionIntel,
} from "./projections";

function week(gw: number, points: number | null) {
  return { gw, points, low: null, high: null, minutes: 80, start: 0.9, fixtures: 1 };
}

const HAALAND: ProjectedPlayer = {
  code: 223094,
  club: "MCI",
  role: "ST",
  gameweeks: [week(6, 6.25), week(7, 7.51), week(9, 5.5)],
};

function file(players: unknown[]): IntelProjections {
  return {
    manifest: { season: "26-27", gameweek: 6, exportedAt: "2026-09-24T09:00:00Z", rows: players.length, sources: [] },
    players: players as ProjectedPlayer[],
  };
}

describe("projectionIntel", () => {
  it("keys each player on his code", () => {
    expect(projectionIntel(file([HAALAND])).get(223094)?.club).toBe("MCI");
  });

  it("drops a row with no code and a gameweek with no number, and reads a missing file as none", () => {
    const broken = { ...HAALAND, gameweeks: [week(6, 6.25), { ...week(7, 1), gw: "7" }] };
    const read = projectionIntel(file([{ ...HAALAND, code: "x" }, { ...broken, code: 1 }]));
    expect([...read.keys()]).toEqual([1]);
    expect(read.get(1)?.gameweeks.map((g) => g.gw)).toEqual([6]);
    expect(projectionIntel(null).size).toBe(0);
  });

  it("keeps a points reading that is not a number as absent, never nought", () => {
    const odd = { ...HAALAND, gameweeks: [{ ...week(6, 1), points: "high" }] };
    expect(projectionIntel(file([odd])).get(223094)?.gameweeks[0].points).toBeNull();
  });
});

describe("nextGameweeks", () => {
  it("lays his projections on the window, leaving a round he has none for empty", () => {
    expect(nextGameweeks(HAALAND, [7, 8, 9]).map((g) => g?.points ?? null)).toEqual([7.51, null, 5.5]);
  });
});

describe("projectedTotal", () => {
  it("adds the rounds he has a reading for", () => {
    expect(projectedTotal(HAALAND, [6, 7, 8])).toBeCloseTo(13.76);
  });

  it("is absent when no round in the window has one", () => {
    expect(projectedTotal(HAALAND, [10, 11])).toBeNull();
  });
});
