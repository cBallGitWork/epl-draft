import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseRotowireXi } from "@epl/core";
import { rotowireClubs } from "./clubs";

// RotoWire's Arsenal v Leeds and Liverpool v Man City, 9 Oct 2026; each id stands in for its own FPL code.
const HTML = readFileSync(new URL("../../packages/core/src/football/__fixtures__/rotowireLineups.html", import.meta.url), "utf8");
const ties = parseRotowireXi(HTML);
const clubOf = new Map(
  ties.flatMap((tie) => [tie.home, tie.away].flatMap((side) => side.starters.map((id) => [id, side.abbr] as const))),
);
const FIXTURES = [
  { home: "ARS", away: "LEE" },
  { home: "LIV", away: "MCI" },
];
const ISAK = 23369;

describe("rotowireClubs", () => {
  it("files each side under the club its starters play for, with its absences", () => {
    const read = rotowireClubs(ties, (id) => id, (code) => clubOf.get(code) ?? null, FIXTURES);
    expect(Object.keys(read.clubs).sort()).toEqual(["ARS", "LEE", "LIV", "MCI"]);
    expect(read.clubs.LIV.starters.map((man) => man.code)).not.toContain(ISAK);
    expect(read.clubs.LIV.absent).toContainEqual({ code: ISAK, status: "OUT" });
    expect(read.refused).toEqual([]);
  });

  it("refuses a match that is not in this gameweek", () => {
    const read = rotowireClubs(ties, (id) => id, (code) => clubOf.get(code) ?? null, FIXTURES.slice(0, 1));
    expect(Object.keys(read.clubs).sort()).toEqual(["ARS", "LEE"]);
    expect(read.refused).toEqual(["LIV v MCI: not one of this gameweek's fixtures"]);
  });

  it("reports a man it cannot join and refuses the eleven he leaves short", () => {
    const read = rotowireClubs(ties, (id) => (id === 21124 ? null : id), (code) => clubOf.get(code) ?? null, FIXTURES);
    expect(read.unjoined).toEqual([{ abbr: "LIV", rotowireId: 21124 }]);
    expect(read.clubs.LIV).toBeUndefined();
    expect(read.refused).toEqual(["LIV: 10 starters, not 11"]);
  });
});
