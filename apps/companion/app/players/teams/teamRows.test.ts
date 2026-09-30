import { describe, expect, it } from "vitest";
import type { Club, PlClubSeason, SeasonTotals } from "@epl/core";
import { teamRows } from "./teamRows";

const club = (id: number, code: number, shortName: string): Club => ({ id, code, name: shortName, shortName });
const ARS = club(1, 3, "ARS");
const BRE = club(2, 94, "BRE");

const season = (clubCode: number, goals: number) => ({ clubCode, goals }) as PlClubSeason;
const squad = (expectedGoals: number) => ({ expectedGoals }) as SeasonTotals;

describe("teamRows", () => {
  it("joins the Premier League's season on the club code and FPL's squad on the club id", () => {
    const [ars, bre] = teamRows([ARS, BRE], [season(94, 10), season(3, 8)], new Map([[1, squad(11.6)]]));
    expect(ars.season?.goals).toBe(8);
    expect(ars.squad?.expectedGoals).toBe(11.6);
    expect(bre.season?.goals).toBe(10);
  });

  it("is an absence, not nought, where neither provider has the club", () => {
    const [ars] = teamRows([ARS], [season(94, 10)], new Map());
    expect(ars).toMatchObject({ season: null, squad: null });
  });
});
