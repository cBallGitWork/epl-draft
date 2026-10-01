import { describe, expect, it } from "vitest";
import { formations } from "./formations";
import type { RosterLimits } from "./types";

const league: RosterLimits = {
  maxTotalPlayers: 14,
  maxActivePlayers: 11,
  maxReservePlayers: 3,
  maxActiveByPosition: { G: 1, D: 5, M: 5, F: 3 },
  minActiveByPosition: { G: 1, D: 3, M: 2, F: 1 },
};

const shape = (formation: Record<string, number>) => `${formation.D}-${formation.M}-${formation.F}`;

describe("formations", () => {
  it("gives exactly the eight shapes the league's caps and floors allow", () => {
    expect(formations(league).map(shape).sort()).toEqual(
      ["3-4-3", "3-5-2", "4-3-3", "4-4-2", "4-5-1", "5-2-3", "5-3-2", "5-4-1"],
    );
  });

  it("always fields one keeper", () => {
    expect(formations(league).every((formation) => formation.G === 1)).toBe(true);
  });

  it("refuses without a published total", () => {
    expect(formations({ ...league, maxActivePlayers: null })).toEqual([]);
  });

  it("refuses when a position's minimum is not on record", () => {
    expect(formations({ ...league, minActiveByPosition: { D: 3, M: 2, F: 1 } })).toEqual([]);
    expect(formations({ ...league, minActiveByPosition: {} })).toEqual([]);
  });

  it("follows a commissioner who changes the caps", () => {
    const wide = formations({ ...league, maxActiveByPosition: { G: 1, D: 5, M: 5, F: 4 } }).map(shape);
    expect(wide).toContain("3-3-4");
  });
});
