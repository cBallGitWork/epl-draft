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

  // Craig, 8 Oct 2026: "ohi, dome and algie is milan derby"; Fellows is not in it.
  it("plays the Milan Derby between any two of Ohi, Dome and Algie, and Ohi v Fellows as the Arteta match alone", () => {
    for (const [a, b] of [["qgucu9dgmufwva1x", "0g0j5mkomuqqwsbu"], ["0g0j5mkomuqqwsbu", "aekx2715mtzgcl3f"], ["aekx2715mtzgcl3f", "qgucu9dgmufwva1x"]]) {
      expect(derbyBetween(a, b)?.name).toBe("Milan Derby");
    }
    expect(derbyBetween("qgucu9dgmufwva1x", "7z8fy0pnmuogbtdw")).toEqual({ name: "Mikel Arteta Appreciation Match", also: [], why: [] });
    expect(derbyBetween("0g0j5mkomuqqwsbu", "7z8fy0pnmuogbtdw")).toBeNull();
  });
});
