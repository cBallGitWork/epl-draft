import { describe, expect, it } from "vitest";
import type { ProjectedGameweek, ProjectedPlayer } from "../football/intel/projections";
import { mapLeagueInfo } from "../league/fantrax/map";
import real from "../league/fantrax/__fixtures__/leagueInfoScoringReal.json";
import { scoringOf } from "../league/selectors";
import {
  clubCleanSheets,
  cohortRate,
  leagueWeek,
  observedAt,
  projectionCodes,
  shrunkRate,
  type SlotRates,
} from "./leagueProjection";

// The real league's getLeagueInfo as it stood on 1 Oct 2026: FPL's prices for goals, assists, clean sheets, minutes
// and conceding at each position, no bonus, DefCon on DFP/DFP3 bands, and a keeper's work (GKP) at 1 per 3.
const scoring = scoringOf(mapLeagueInfo(real))!;
const codes = projectionCodes(scoring);
const NONE: SlotRates = { defcon: 0, keeper: 0 };

function week(parts: Partial<NonNullable<ProjectedGameweek["parts"]>>, extra: Partial<ProjectedGameweek> = {}): ProjectedGameweek {
  const full = { goals: 0, assists: 0, cleanSheets: 0, bonus: 0, saves: 0, defcon: 0, appearance: 2, ...parts };
  const sum = Object.values(full).reduce<number>((total, part) => total + (part ?? 0), 0);
  return { gw: 6, points: sum - 0.5, low: null, high: null, minutes: 90, start: 1, fixtures: 1, parts: full, ...extra };
}

describe("projectionCodes", () => {
  it("finds the real league's categories by meaning", () => {
    expect(codes).toEqual({
      goals: "G",
      assists: "AT",
      cleanSheets: "CS",
      minutes: "Min",
      conceded: ["GA", "GAO"],
      defcon: ["DFP", "DFP3"],
      keeper: "GKP",
    });
  });
});

describe("leagueWeek", () => {
  const mid = week({ goals: 2.5, assists: 1.5, cleanSheets: 0.4, bonus: 1, defcon: 0.6 });

  it("keeps FPL's prices where the slot pays the same, and drops bonus and FPL's DefCon", () => {
    const priced = leagueWeek(mid, 3, "M", scoring.rules, codes, { defcon: 0.45, keeper: 0 }, null)!;
    expect(priced.parts).toMatchObject({ goals: 2.5, assists: 1.5, cleanSheets: 0.4, appearance: 2, conceded: -0.5, keeper: 0 });
    expect(priced.parts.defcon).toBeCloseTo(0.45);
    expect(priced.points).toBeCloseTo(2.5 + 1.5 + 0.4 + 2 - 0.5 + 0.45);
  });

  it("reprices an FPL midfielder at forward: a goal worth 4, no clean sheet", () => {
    const priced = leagueWeek(mid, 3, "F", scoring.rules, codes, NONE, null)!;
    expect(priced.parts.goals).toBeCloseTo(2);
    expect(priced.parts.cleanSheets).toBe(0);
  });

  it("charges conceding to an FPL midfielder filed in defence, off his club's clean-sheet chance", () => {
    const priced = leagueWeek(mid, 3, "D", scoring.rules, codes, NONE, 0.3)!;
    expect(priced.parts.cleanSheets).toBeCloseTo(1.6);
    expect(priced.parts.conceded).toBeLessThan(-0.5);
  });

  it("lifts the conceding off an FPL defender filed in midfield", () => {
    const defender = week({ cleanSheets: 1.2 }, { points: 2 + 1.2 - 0.9 });
    const priced = leagueWeek(defender, 2, "M", scoring.rules, codes, NONE, 0.3)!;
    expect(priced.parts.cleanSheets).toBeCloseTo(0.3);
    expect(priced.parts.conceded).toBeGreaterThan(-0.9);
  });

  it("gives an FPL forward filed in midfield his club's clean sheets, by his chance of starting", () => {
    const forward = week({ goals: 2 }, { start: 0.5 });
    expect(leagueWeek(forward, 4, "M", scoring.rules, codes, NONE, 0.4)!.parts.cleanSheets).toBeCloseTo(0.2);
  });

  it("pays a keeper his own work per 90 in place of FPL's saves", () => {
    const keeper = week({ cleanSheets: 1.6, saves: 1 }, { minutes: 45 });
    const priced = leagueWeek(keeper, 1, "G", scoring.rules, codes, { defcon: 0, keeper: 1.2 }, null)!;
    expect(priced.parts.keeper).toBeCloseTo(0.6);
    expect(priced.parts.cleanSheets).toBeCloseTo(1.6);
  });

  it("has no reading where the model has none", () => {
    expect(leagueWeek(week({}, { points: null }), 3, "M", scoring.rules, codes, NONE, null)).toBeNull();
  });
});

describe("observed rates", () => {
  const matches = [
    { minutes: 90, counts: { DFP: 3, DFP3: 9 } },
    { minutes: 90, counts: { DFP: 6, DFP3: 12 } },
    { minutes: 45, counts: { DFP: 1, DFP3: 2 } },
    { minutes: 90, counts: { DFP: null, DFP3: 8 } },
  ];

  it("prices each match on its own at the slot's bands, skipping one short a count", () => {
    expect(observedAt(scoring.rules, codes.defcon, "D", matches)).toEqual({ points: 3, minutes: 225 });
    expect(observedAt(scoring.rules, codes.defcon, "M", matches)).toEqual({ points: 3, minutes: 225 });
    expect(observedAt(scoring.rules, codes.defcon, "F", matches)).toEqual({ points: 4, minutes: 225 });
  });

  it("averages a cohort per 90 and draws a man toward it by the weight", () => {
    expect(cohortRate([{ points: 3, minutes: 180 }, { points: 0, minutes: 90 }])).toBe(1);
    expect(cohortRate([])).toBe(0);
    expect(shrunkRate({ points: 0, minutes: 0 }, 0.5, 270)).toBe(0.5);
    expect(shrunkRate({ points: 6, minutes: 270 }, 0, 270)).toBe(1);
  });
});

describe("clubCleanSheets", () => {
  const keeper = (code: number, start: number, cleanSheets: number): ProjectedPlayer => ({
    code,
    club: "ARS",
    role: "GK",
    gameweeks: [week({ cleanSheets }, { start })],
  });

  it("reads the club's chance off its likeliest starter", () => {
    const sheets = clubCleanSheets([keeper(1, 0.1, 0.1), keeper(2, 0.9, 1.44)], () => 1);
    expect(sheets.get("ARS")?.get(6)).toBeCloseTo(0.4);
  });
});
