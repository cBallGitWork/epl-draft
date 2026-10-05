import { describe, expect, it } from "vitest";
import { shortName, shortTeamNames } from "./teamNames";

describe("shortName", () => {
  it("prints the league's short name for a team that has one", () => {
    expect(shortName("7to6xosimu8hyyw5", "If anyone can, Bannan can")).toBe("Bannan");
  });

  it("prints the full name for a team with no short name", () => {
    expect(shortName("demo0100000000000", "Ctrl Alt Defeat")).toBe("Ctrl Alt Defeat");
  });

  it("shortens a list's teamName, leaving the id and the rest alone", () => {
    expect(shortTeamNames([{ teamId: "aekx2715mtzgcl3f", teamName: "The Truffle Pigs" }])).toEqual([
      { teamId: "aekx2715mtzgcl3f", teamName: "Truffles" },
    ]);
  });
});
