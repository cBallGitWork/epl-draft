import { describe, expect, it } from "vitest";
import type { Club, SeasonTotals } from "@epl/core";
import { teamRows, type PoolMan } from "./teamRows";

const club = (id: number, code: number, shortName: string): Club => ({ id, code, name: shortName, shortName });
const ARS = club(1, 3, "ARS");
const BRE = club(2, 94, "BRE");

function man(over: Partial<PoolMan>): PoolMan {
  return { club: "ARS", position: "M", owned: true, points: 10, cleanSheets: null, goalsAgainst: null, ...over };
}

function season(over: Partial<SeasonTotals>): SeasonTotals {
  return {
    goals: 0, assists: 0, cleanSheets: 0, minutes: 0, starts: 0, expectedGoals: 0, expectedAssists: 0,
    expectedGoalsConceded: 0, influence: 0, creativity: 0, threat: 0, tackles: 0, clearancesBlocksInterceptions: 0,
    recoveries: 0, saves: 0, goalsConceded: 0, bonus: 0, bps: 0, ...over,
  };
}

const NO_RUNS = { attack: new Map<number, number>(), defence: new Map<number, number>() };

describe("teamRows", () => {
  it("sums a club's points, and the part nobody owns", () => {
    const [ars] = teamRows([ARS], [man({ points: 10 }), man({ points: 6, owned: false })], new Map(), NO_RUNS);
    expect(ars).toMatchObject({ fpts: 16, fa: 6, mid: 16 });
  });

  it("files each man under the position Fantrax lists", () => {
    const [ars] = teamRows(
      [ARS],
      [man({ position: "G", points: 4 }), man({ position: "D", points: 5 }), man({ position: "F", points: 7 })],
      new Map(),
      NO_RUNS,
    );
    expect(ars).toMatchObject({ gk: 4, def: 5, mid: null, fwd: 7 });
  });

  it("reads Fantrax's spelling of a club: Brentford is BRF there", () => {
    const [, bre] = teamRows([ARS, BRE], [man({ club: "BRF", points: 9 })], new Map(), NO_RUNS);
    expect(bre.fpts).toBe(9);
  });

  it("takes clean sheets and goals against off the keepers only", () => {
    const [ars] = teamRows(
      [ARS],
      [
        man({ position: "G", cleanSheets: 2, goalsAgainst: 3 }),
        man({ position: "G", cleanSheets: 1, goalsAgainst: 1 }),
        man({ position: "D", cleanSheets: 3, goalsAgainst: 4 }),
      ],
      new Map(),
      NO_RUNS,
    );
    expect(ars).toMatchObject({ cs: 3, ga: 4 });
  });

  it("shares FPL's squad xGC between the eleven who conceded it", () => {
    const [ars] = teamRows([ARS], [], new Map([[1, season({ expectedGoalsConceded: 44, expectedGoals: 11.6 })]]), NO_RUNS);
    expect(ars.xgc).toBeCloseTo(4);
    expect(ars.xg).toBe(11.6);
  });

  it("is a dash, not nought, where nothing was read, and carries the run by club code", () => {
    const runs = { attack: new Map([[3, 7.5]]), defence: new Map<number, number>() };
    const [ars] = teamRows([ARS], [man({ points: null })], new Map(), runs);
    expect(ars).toMatchObject({ fpts: null, fa: null, cs: null, xg: null, attack: 7.5, defence: null });
  });
});
