import { describe, expect, it } from "vitest";
import { mapStandings } from "./standings";
import type { RawStandingsPage } from "./standingsPage";
import standingsPage from "./__fixtures__/standingsPage.json";

// The rehearsal league mid-gameweek 2, captured 29 Aug 2026 — the first read
// with anything but zeroes in it, and therefore the first that could tell wins
// from draws from losses at all.

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
});
