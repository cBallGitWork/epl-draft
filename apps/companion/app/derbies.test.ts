import { describe, expect, it } from "vitest";
import names from "../../../data/leagues/short-names.json";
import { DERBIES, derbyBetween } from "./derbies";

// The file is typed by hand, so a slipped id would name nothing and say nothing.
describe("the league's derbies", () => {
  it("names only the league's own teams, two or more a derby, each with a name", () => {
    const teams = new Set(Object.keys(names.shortNames));
    for (const derby of DERBIES) {
      expect(derby.teams.length).toBeGreaterThanOrEqual(2);
      expect(derby.names.length).toBeGreaterThan(0);
      for (const team of derby.teams) expect(teams, `${derby.between}: ${team}`).toContain(team);
    }
  });

  it("calls Ohi v Fellows the Arteta match before the Milan Derby", () => {
    expect(derbyBetween("qgucu9dgmufwva1x", "7z8fy0pnmuogbtdw")?.name).toBe("Mikel Arteta Appreciation Match");
    expect(derbyBetween("0g0j5mkomuqqwsbu", "7z8fy0pnmuogbtdw")?.name).toBe("Milan Derby");
  });
});
