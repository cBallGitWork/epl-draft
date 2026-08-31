import { describe, expect, it } from "vitest";
import { mapStandings } from "./standings";
import type { RawStandingsPage } from "./standingsPage";
import standingsPage from "./__fixtures__/standingsPage.json";

// The rehearsal league mid-gameweek 2, captured 29 Aug 2026 — the first read
// with anything but zeroes in it, and therefore the first that could tell wins
// from draws from losses at all. The page the table is drawn from, which since
// 31 Aug is the whole of it: the fxea array was read alongside for `gamesBack`
// and that column went when the table became a football one.

describe("mapStandings", () => {
  const rows = mapStandings(standingsPage as RawStandingsPage);

  it("reads every team's row", () => {
    expect(rows).toHaveLength(4);
    expect(rows.map((row) => row.teamName)).toContain("123");
  });

  it("orders by Fantrax's rank", () => {
    expect(rows.map((row) => row.rank)).toEqual([1, 2, 3, 4]);
  });

  it("reads the league's points rather than adding them up", () => {
    // Three for a win, which is this league's setting and not our arithmetic.
    expect(rows[0]).toMatchObject({ won: 1, drawn: 0, lost: 0, points: 3, pointsFor: 59 });
    expect(rows[3]).toMatchObject({ won: 0, drawn: 0, lost: 1, points: 0, pointsFor: 25 });
  });

  it("keeps points and fantasy points apart", () => {
    // The table that made the old one wrong: third place scored more than
    // fourth AND more than the leader's beaten opponent, and still has nought.
    const third = rows[2];
    expect(third?.pointsFor).toBe(47);
    expect(third?.points).toBe(0);
  });

  // The page carries the standings AND one table per played round, and the
  // round tables name teams too. Picking by position or by counting tables would
  // read gameweek 2's results as a league table.
  it("takes the standings table and not the round tables beside it", () => {
    expect((standingsPage as RawStandingsPage).tableList).toHaveLength(2);
    expect(rows.every((row) => row.teamId.length > 0)).toBe(true);
  });

  it("reads columns by Fantrax's key, not by where they sit", () => {
    const page = structuredClone(standingsPage) as RawStandingsPage;
    const table = page.tableList?.[0];
    const cells = table?.header?.cells ?? [];
    const rowCells = table?.rows?.[0]?.cells ?? [];
    // Swap wins with losses, header and body together, as their own site would
    // if a manager reordered the columns.
    [cells[0], cells[2]] = [cells[2]!, cells[0]!];
    [rowCells[0], rowCells[2]] = [rowCells[2]!, rowCells[0]!];
    expect(mapStandings(page)[0]).toMatchObject({ won: 1, lost: 0 });
  });

  it("returns nothing for a league nobody has joined", () => {
    // What the real league answers every day until 10 Oct: the table is there,
    // with no rows in it.
    const empty: RawStandingsPage = {
      tableList: [{ caption: "Standings", fixedHeader: { cells: [{ key: "team" }] }, rows: [] }],
    };
    expect(mapStandings(empty)).toEqual([]);
    expect(mapStandings({})).toEqual([]);
  });

  // Fantrax publishes no played column — their header is win, draw, loss,
  // points, winpc, wwOrder, pointsFor, pointsAgainst, streak. This one is ours,
  // and it is the only number on the table that is.
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

  // The column that replaced games-back, and the one a head-to-head league most
  // needs: `123` outscored test3 over the round and sits below them on nought,
  // because they were drawn against someone who put 63 past them.
  it("reads points against, which is where a head-to-head draw shows", () => {
    expect(rows.map((row) => row.pointsAgainst)).toEqual([35, 37, 63, 45]);
    expect(rows[2]).toMatchObject({ pointsFor: 47, pointsAgainst: 63, points: 0 });
    expect(rows[1]).toMatchObject({ pointsFor: 49, pointsAgainst: 37, points: 3 });
  });
});
