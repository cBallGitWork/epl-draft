import { describe, expect, it } from "vitest";
import type { StandingsRow } from "../../league/types";
import { tableAfter, tableBefore, tableMoves, tablePoints } from "./table";

const row = (teamName: string, rank: number, won: number, drawn: number, lost: number, pointsFor: number): StandingsRow => ({
  teamId: teamName, teamName, rank, won, drawn, lost, played: won + drawn + lost, points: won * 3 + drawn, pointsFor, pointsAgainst: 0,
});
const before = [row("Dons", 1, 3, 0, 1, 160), row("Notemail", 2, 2, 1, 1, 150), row("123", 3, 2, 0, 2, 170), row("test2", 4, 1, 1, 2, 120), row("test4", 5, 1, 0, 3, 110)];
const side = (teamId: string, forPts: number, against: number) => ({ teamId, name: teamId, opponent: "x", for: forPts, against });

describe("the table after the round", () => {
  it("reads what a win and a draw are worth off the table, and refuses a table that cannot say", () => {
    expect(tablePoints(before)).toEqual({ win: 3, draw: 1 });
    expect(tablePoints([row("Dons", 1, 0, 0, 1, 10)])).toBeNull();
  });

  it("names a new leader, the new bottom side and a climb of two places", () => {
    const after = tableAfter(before, [side("Dons", 20, 40), side("123", 40, 20), side("Notemail", 30, 31), side("test4", 50, 10), side("test2", 10, 50)])!;
    expect(tableMoves(before, after).map((f) => `${f.kind}: ${f.text}`)).toEqual(expect.arrayContaining(["top: 123 went top, above Dons", "bottom: test2 went bottom"]));
    expect(tableMoves(before, after).map((f) => f.text)).toEqual(expect.arrayContaining(["Dons fell from 1st to 2nd", "test4 rose from 5th to 4th"]));
    const climb = tableAfter(before, [side("test4", 100, 10), side("Notemail", 10, 50), side("Dons", 10, 50), side("123", 10, 50), side("test2", 10, 50)])!;
    expect(tableMoves(before, climb).map((f) => f.text)).toContain("test4 rose from 5th to 3rd");
  });

  it("leaves the table unmoved by a draw before any draw has said what one is worth", () => {
    const won = (teamName: string, rank: number, w: number, l: number, pointsFor: number) => row(teamName, rank, w, 0, l, pointsFor);
    const noDraws = [won("A", 1, 1, 0, 100), won("B", 2, 1, 0, 90), won("C", 3, 0, 1, 80), won("D", 4, 0, 1, 70)];
    expect(tableAfter(noDraws, [side("A", 50, 50), side("B", 50, 50), side("C", 60, 40), side("D", 40, 60)])).toBeNull();
    expect(tableAfter(noDraws, [side("A", 60, 50), side("B", 50, 60), side("C", 60, 40), side("D", 40, 60)])).not.toBeNull();
  });

  it("says a leader stayed top", () => {
    const held = tableAfter(before, [side("Dons", 40, 20), side("123", 20, 40), side("Notemail", 30, 31), side("test4", 10, 50), side("test2", 50, 10)])!;
    expect(tableMoves(before, held)).toContainEqual({ teamId: "Dons", kind: "stayed-top", text: "Dons stayed top" });
  });

  it("never says a side rose when it is still bottom, level with another", () => {
    const r = (teamName: string, rank: number) => row(teamName, rank, 0, 0, 0, 0);
    const moves = tableMoves([r("A", 1), r("B", 2), r("C", 3), r("D", 4)], [r("B", 1), r("A", 2), r("D", 3), r("C", 3)]);
    expect(moves.map((f) => f.text)).not.toContain("D rose from 4th to 3rd");
  });
});

describe("tableBefore", () => {
  it("rebuilds the table from the results before the round, whatever Fantrax's table already holds", () => {
    const g = (period: number, result: "W" | "D" | "L", pointsFor: number) => ({ period, result, pointsFor, pointsAgainst: 0 });
    const runs = new Map([["Dons", [g(1, "W", 40), g(2, "W", 30), g(3, "L", 20)]], ["Notemail", [g(1, "L", 35), g(2, "D", 30), g(3, "W", 50)]]]);
    const rows = [row("Dons", 1, 2, 0, 1, 90), row("Notemail", 2, 1, 1, 1, 115)];
    expect(tableBefore(rows, runs, 3, { win: 3, draw: 1 }).map((r) => `${r.rank} ${r.teamName} ${r.points} ${r.pointsFor}`)).toEqual(["1 Dons 6 70", "2 Notemail 1 65"]);
  });
});
