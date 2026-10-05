import { describe, expect, it } from "vitest";
import { shortName, shortTeamNames, shortTeams } from "./teamNames";

describe("shortName", () => {
  it("prints the league's short name for a team that has one", () => {
    expect(shortName("7to6xosimu8hyyw5", "If anyone can, Bannan can")).toBe("Bannan");
  });

  it("prints the full name for a team with no short name", () => {
    expect(shortName("demo0100000000000", "Ctrl Alt Defeat")).toBe("Ctrl Alt Defeat");
  });

  it("shortens lists by name and by teamName, leaving the id and the rest alone", () => {
    expect(shortTeams([{ teamId: "l5kunst8msgbirdf", name: "The Raccoons", x: 1 }])).toEqual([
      { teamId: "l5kunst8msgbirdf", name: "Raccoons", x: 1 },
    ]);
    expect(shortTeamNames([{ teamId: "aekx2715mtzgcl3f", teamName: "The Truffle Pigs" }])).toEqual([
      { teamId: "aekx2715mtzgcl3f", teamName: "Truffles" },
    ]);
  });
});
