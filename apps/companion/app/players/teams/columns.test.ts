import { describe, expect, it } from "vitest";
import type { Club } from "@epl/core";
import { TEAM_COLUMNS, columnGroups, sortedTeams, teamColumn } from "./columns";
import type { TeamRow } from "./teamRows";

const club = (shortName: string): Club => ({ id: shortName.length, code: 1, name: shortName, shortName });

function row(shortName: string, over: Partial<TeamRow>): TeamRow {
  return {
    club: club(shortName), fpts: 100, fa: 10, attack: 10, defence: 10, gk: 1, def: 1, mid: 1, fwd: 1,
    cs: 1, ga: 1, xg: 1, xa: 1, xgc: 1, ...over,
  };
}

describe("sortedTeams", () => {
  const rows = [row("ARS", { fpts: 250, attack: 10 }), row("BHA", { fpts: 307, attack: 10.7 }), row("HUL", { fpts: null, attack: 11 })];

  it("orders by the column and sinks an absent figure", () => {
    expect(sortedTeams(rows, teamColumn("fpts"), true).map((r) => r.club.shortName)).toEqual(["BHA", "ARS", "HUL"]);
  });

  it("breaks a tie on points, then the name", () => {
    const tied = [row("CHE", { xg: 5, fpts: 100 }), row("ARS", { xg: 5, fpts: 100 }), row("BHA", { xg: 5, fpts: 200 })];
    expect(sortedTeams(tied, teamColumn("xg"), true).map((r) => r.club.shortName)).toEqual(["BHA", "ARS", "CHE"]);
  });
});

describe("the columns", () => {
  it("keep FPL's goals, assists and clean sheets off the board", () => {
    expect(TEAM_COLUMNS.map((column) => column.head)).not.toContain("G");
    expect(TEAM_COLUMNS.find((column) => column.key === "cs")?.title).toContain("Fantrax");
  });

  it("never light our own reading", () => {
    for (const column of TEAM_COLUMNS.filter((c) => c.derived)) expect(column.rank).toBeUndefined();
  });

  it("group into the five plates in order", () => {
    expect(columnGroups(TEAM_COLUMNS)).toEqual([
      { group: "Points", span: 2 },
      { group: "Run", span: 2 },
      { group: "Points by position", span: 4 },
      { group: "Keepers", span: 2 },
      { group: "FPL expected", span: 3 },
    ]);
  });

  it("fall back to points for a key nobody knows", () => {
    expect(teamColumn("nope").key).toBe("fpts");
  });
});
