import { describe, expect, it } from "vitest";
import type { Club, PlClubSeason, SeasonTotals } from "@epl/core";
import { TEAM_COLUMNS, columnGroups, sortedTeams, teamColumn } from "./columns";
import type { TeamRow } from "./teamRows";

const club = (shortName: string): Club => ({ id: shortName.length, code: 1, name: shortName, shortName });

function row(shortName: string, season: Partial<PlClubSeason> | null, squad: Partial<SeasonTotals> | null = null): TeamRow {
  return {
    club: club(shortName),
    season: season === null ? null : ({ clubCode: 1, ...season } as PlClubSeason),
    squad: squad === null ? null : (squad as SeasonTotals),
  };
}

describe("sortedTeams", () => {
  it("orders by the column and sinks an absent figure", () => {
    const rows = [row("ARS", { goals: 8 }), row("HUL", null), row("BHA", { goals: 16 })];
    expect(sortedTeams(rows, teamColumn("g"), true).map((r) => r.club.shortName)).toEqual(["BHA", "ARS", "HUL"]);
    expect(sortedTeams(rows, teamColumn("g"), false).map((r) => r.club.shortName)).toEqual(["ARS", "BHA", "HUL"]);
  });

  it("breaks a tie on the name", () => {
    const tied = [row("CHE", { shots: 60 }), row("ARS", { shots: 60 })];
    expect(sortedTeams(tied, teamColumn("sh"), true).map((r) => r.club.shortName)).toEqual(["ARS", "CHE"]);
  });
});

describe("the columns", () => {
  it("carry no fantasy figure and no fixture run", () => {
    const heads = TEAM_COLUMNS.map((column) => column.head);
    for (const gone of ["FPts", "FA", "Attack", "Defence", "GK", "Bonus", "BPS"]) expect(heads).not.toContain(gone);
  });

  it("print a played nought as nought and a missing season as a dash", () => {
    const goals = teamColumn("g");
    expect(goals.of(row("ARS", { goals: 0 }))).toBe(0);
    expect(goals.of(row("ARS", null))).toBeNull();
  });

  it("share FPL's squad xGC between the eleven who conceded it", () => {
    expect(teamColumn("xgc").of(row("ARS", null, { expectedGoalsConceded: 44 }))).toBeCloseTo(4);
    expect(teamColumn("xg").of(row("ARS", null, null))).toBeNull();
  });

  it("group into five plates in order", () => {
    expect(columnGroups(TEAM_COLUMNS).map((entry) => entry.group)).toEqual(["Attack", "Chances", "Defence", "Errors", "Discipline"]);
  });

  it("light the bad end red where more is worse", () => {
    for (const key of ["gc", "xgc", "sha", "ers", "erg", "fls", "yc", "rc"]) expect(teamColumn(key).rank).toBe("low");
  });

  it("fall back to goals for a key nobody knows", () => {
    expect(teamColumn("fpts").key).toBe("g");
  });
});
