import { describe, expect, it } from "vitest";
import { mapLeagueInfo, scoringOf, type Bridge, type ProjectedGameweek, type ProjectedPlayer } from "@epl/core";
import real from "../../packages/core/src/league/fantrax/__fixtures__/leagueInfoScoringReal.json";
import { buildPack, type FplSide, type PoolSide } from "./build";

const scoring = scoringOf(mapLeagueInfo(real))!;

function week(gw: number, goals: number): ProjectedGameweek {
  const parts = { goals, assists: 0, cleanSheets: 0.4, bonus: 1, saves: 0, defcon: 0, appearance: 2 };
  return { gw, points: goals + 3.4, low: null, high: null, minutes: 90, start: 1, fixtures: 1, parts };
}

const man = (fantraxId: string, eligible: string[]): PoolSide => ({ fantraxId, name: fantraxId, club: "ARS", primary: eligible[0], eligible, adp: null });
const projected = (code: number): ProjectedPlayer => ({ code, club: "ARS", role: "RW", gameweeks: [week(6, 2.5), week(7, 5)] });

const pack = buildPack({
  scoring,
  pool: [man("winger", ["F", "M"]), man("stranger", ["M"]), man("benchman", ["M"])],
  matches: new Map([["winger", [{ minutes: 90, counts: { DFP: 0, DFP3: 9 } }]]]),
  bridge: { winger: { fplCode: 10, matchedBy: "exact", confidence: 100 }, benchman: { fplCode: 11, matchedBy: "exact", confidence: 100 } } as Bridge,
  projections: new Map([[10, projected(10)], [11, { ...projected(11), gameweeks: [week(6, 0.5)] }]]),
  fpl: new Map<number, FplSide>([[10, { line: 3, status: "d", news: "Knock" }], [11, { line: 3, status: "a", news: "" }]]),
  gameweeks: [6, 7, 8],
  weight: 270,
});

describe("buildPack", () => {
  it("prices only the men the bridge keys and the model projects, best first", () => {
    expect(pack.rows.map((row) => row.fantraxId)).toEqual(["winger", "benchman"]);
  });

  it("prices a man at each slot he holds and leads with the one that pays him most", () => {
    const [winger] = pack.rows;
    expect(Object.keys(winger.positions)).toEqual(["F", "M"]);
    expect(winger.pricedAt).toBe("M");
    expect(winger.total).toBe(winger.positions.M.total);
    expect(winger.positions.F.parts.goals).toBeCloseTo(6);
    expect(winger.perGw[2]).toBeNull();
  });

  it("drops FPL's bonus and carries FPL's word on his fitness", () => {
    const [winger, benchman] = pack.rows;
    expect(winger.positions.M.parts.goals + winger.positions.M.parts.appearance).toBeCloseTo(7.5 + 4);
    expect(winger).toMatchObject({ status: "doubt", note: "Knock", owned: false });
    expect(benchman).toMatchObject({ status: "fit", note: null });
  });

  it("draws a man with no matches to his slot's average", () => {
    const [, benchman] = pack.rows;
    expect(benchman.positions.M.rates.defcon).toBe(pack.priors.M.defcon);
  });
});
