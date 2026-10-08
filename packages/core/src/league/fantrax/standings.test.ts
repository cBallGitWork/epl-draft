import { describe, expect, it } from "vitest";
import { mapStandings, placeTable } from "./standings";
import type { StandingsRow } from "../types";
import type { RawStandingsPage } from "./standingsPage";
import standingsPage from "./__fixtures__/standingsPage.json";

// The rehearsal league's standings page mid-gameweek 2, with wins, draws and losses in it.

describe("mapStandings", () => {
  const rows = mapStandings(standingsPage as RawStandingsPage);

  it("reads every team's row", () => {
    expect(rows).toHaveLength(4);
    expect(rows.map((row) => row.teamName)).toContain("123");
  });

  it("orders the captured table the way Fantrax does", () => {
    expect(rows.map((row) => row.rank)).toEqual([1, 2, 3, 4]);
  });

  it("reads the league's points rather than adding them up", () => {
    // Three for a win, which is this league's setting and not our arithmetic.
    expect(rows[0]).toMatchObject({ won: 1, drawn: 0, lost: 0, points: 3, pointsFor: 59 });
    expect(rows[3]).toMatchObject({ won: 0, drawn: 0, lost: 1, points: 0, pointsFor: 25 });
  });

  it("keeps points and fantasy points apart", () => {
    // Third place scored more than fourth and than the leader's beaten opponent, and still has nought.
    const third = rows[2];
    expect(third?.pointsFor).toBe(47);
    expect(third?.points).toBe(0);
  });

  // The round tables beside the standings name teams too; picked by position, gameweek 2 would read as the table.
  it("takes the standings table and not the round tables beside it", () => {
    expect((standingsPage as RawStandingsPage).tableList).toHaveLength(2);
    expect(rows.every((row) => row.teamId.length > 0)).toBe(true);
  });

  it("reads columns by Fantrax's key, not by where they sit", () => {
    const page = structuredClone(standingsPage) as RawStandingsPage;
    const table = page.tableList?.[0];
    const cells = table?.header?.cells ?? [];
    const rowCells = table?.rows?.[0]?.cells ?? [];
    // Swap wins with losses, header and body together, as a manager reordering columns would.
    [cells[0], cells[2]] = [cells[2]!, cells[0]!];
    [rowCells[0], rowCells[2]] = [rowCells[2]!, rowCells[0]!];
    expect(mapStandings(page)[0]).toMatchObject({ won: 1, lost: 0 });
  });

  it("returns nothing for a league nobody has joined", () => {
    // What an undrafted league answers: the table, with no rows in it.
    const empty: RawStandingsPage = {
      tableList: [{ caption: "Standings", fixedHeader: { cells: [{ key: "team" }] }, rows: [] }],
    };
    expect(mapStandings(empty)).toEqual([]);
    expect(mapStandings({})).toEqual([]);
  });

  // Fantrax publishes no played column; ours is the only number on the table we work out.
  it("adds up a played column Fantrax does not publish", () => {
    expect((standingsPage as RawStandingsPage).tableList?.[0]?.header?.cells
      ?.some((cell) => cell.key === "played")).toBe(false);
    expect(rows.map((row) => row.played)).toEqual([1, 1, 1, 1]);
  });

  it("counts a draw as a game played", () => {
    const page = structuredClone(standingsPage) as RawStandingsPage;
    const cells = page.tableList?.[0]?.rows?.[0]?.cells ?? [];
    // win → 2, draw → 1, loss → 3 in the fixture's own column order.
    cells[0]!.content = "2";
    cells[1]!.content = "1";
    cells[2]!.content = "3";
    expect(mapStandings(page)[0]?.played).toBe(6);
  });

  // Fantasy points for pass 1,000 around gameweek 18: read as NaN they were nought, and so was the tie-break.
  it("reads a total Fantrax prints with a thousands comma, and places the table on it", () => {
    const page = structuredClone(standingsPage) as RawStandingsPage;
    const cells = page.tableList?.[0]?.rows?.[3]?.cells ?? [];
    cells[6]!.content = "1,024.5";
    cells[7]!.content = "1,002";
    expect(mapStandings(page).find((row) => row.teamName === "test4")).toMatchObject({ rank: 3, pointsFor: 1024.5, pointsAgainst: 1002 });
  });

  // Points against is where a head-to-head draw shows: third place conceded 63 and sits on nought.
  it("reads points against, which is where a head-to-head draw shows", () => {
    expect(rows.map((row) => row.pointsAgainst)).toEqual([35, 37, 63, 45]);
    expect(rows[2]).toMatchObject({ pointsFor: 47, pointsAgainst: 63, points: 0 });
    expect(rows[1]).toMatchObject({ pointsFor: 49, pointsAgainst: 37, points: 3 });
  });
});

describe("placeTable", () => {
  const row = (teamName: string, points: number, pointsFor: number, rank: number): StandingsRow => ({
    teamId: teamName, teamName, rank, won: 0, drawn: 0, lost: 0, played: 0,
    points, pointsFor, pointsAgainst: 0,
  });

  it("breaks a points tie on fantasy points for", () => {
    const placed = placeTable([row("a", 3, 50, 1), row("b", 3, 70, 2), row("c", 6, 10, 3)]);
    expect(placed.map((r) => [r.teamName, r.rank])).toEqual([["c", 1], ["b", 2], ["a", 3]]);
  });

  it("puts teams level on both in one fixed order, whatever ranks Fantrax dealt them", () => {
    // Before a ball is kicked every team is 0 and 0, and Fantrax deals those ranks afresh on each read.
    const first = placeTable([row("test4", 0, 0, 5), row("test1", 0, 0, 6), row("test31", 0, 0, 7)]);
    const second = placeTable([row("test31", 0, 0, 5), row("test4", 0, 0, 6), row("test1", 0, 0, 7)]);
    expect(first).toEqual(second);
    expect(first.map((r) => r.teamName)).toEqual(["test1", "test31", "test4"]);
  });

  it("gives teams level on points and points for one place, and the next team its own count", () => {
    const placed = placeTable([row("c", 3, 40, 1), row("b", 6, 90, 2), row("a", 6, 90, 3), row("d", 0, 10, 4)]);
    expect(placed.map((r) => [r.teamName, r.rank])).toEqual([["a", 1], ["b", 1], ["c", 3], ["d", 4]]);
  });

  it("shares a place only on both counts: level on points alone is two places", () => {
    const placed = placeTable([row("a", 6, 80, 1), row("b", 6, 90, 2), row("c", 6, 90, 3)]);
    expect(placed.map((r) => [r.teamName, r.rank])).toEqual([["b", 1], ["c", 1], ["a", 3]]);
  });

  it("puts every team in first before a ball is kicked", () => {
    const placed = placeTable([row("x", 0, 0, 2), row("y", 0, 0, 1), row("z", 0, 0, 3)]);
    expect(placed.map((r) => r.rank)).toEqual([1, 1, 1]);
  });
});
