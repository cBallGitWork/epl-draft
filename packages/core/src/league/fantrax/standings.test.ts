import { describe, expect, it } from "vitest";
import { mapStandings } from "./standings";
import type { RawStandings } from "./raw";
import type { RawStandingsPage } from "./standingsPage";
import standingsPage from "./__fixtures__/standingsPage.json";
import standingsArray from "./__fixtures__/standingsArray.json";

// The rehearsal league mid-gameweek 2, captured 29 Aug 2026 — the first read
// with anything but zeroes in it, and therefore the first that could tell wins
// from draws from losses at all. Both shapes of the same day: the page the table
// is drawn from, and the array carrying the one column it does not.

describe("mapStandings", () => {
  const rows = mapStandings(standingsPage as RawStandingsPage, standingsArray as RawStandings);

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
    expect(mapStandings(page, [])[0]).toMatchObject({ won: 1, lost: 0 });
  });

  it("returns nothing for a league nobody has joined", () => {
    // What the real league answers every day until 10 Oct: the table is there,
    // with no rows in it.
    const empty: RawStandingsPage = {
      tableList: [{ caption: "Standings", fixedHeader: { cells: [{ key: "team" }] }, rows: [] }],
    };
    expect(mapStandings(empty, [])).toEqual([]);
    expect(mapStandings({}, [])).toEqual([]);
  });

  // The array's own column, and the reason the table reads two payloads. It is
  // live: two teams level at the top and two a game behind, which is what makes
  // it worth a column at all.
  it("takes games back from the array, which is the only read that has it", () => {
    expect(rows.map((row) => row.gamesBack)).toEqual([0, 0, 1, 1]);
  });

  // The failure the null is modelled for. Everything else on the table comes off
  // the page and is unharmed.
  it("dashes games back rather than zeroing it when the array is not there", () => {
    const alone = mapStandings(standingsPage as RawStandingsPage, []);
    expect(alone.map((row) => row.gamesBack)).toEqual([null, null, null, null]);
    expect(alone[0]).toMatchObject({ won: 1, points: 3 });
  });

  // A fraction, not a percentage: the leader is on 1 and not on 100. Printing it
  // as "1%" would put the best side in the league last.
  it("reads the win percentage as the fraction Fantrax means", () => {
    expect(rows.map((row) => row.winPercentage)).toEqual([1, 1, 0, 0]);
  });

  it("dashes the win fraction when the column is gone, and never zeroes it", () => {
    const page = structuredClone(standingsPage) as RawStandingsPage;
    const table = page.tableList?.[0];
    if (table?.header?.cells) table.header.cells = table.header.cells.filter((c) => c.key !== "winpc");
    expect(mapStandings(page, [])[0]?.winPercentage).toBeNull();
  });

  // A row Fantrax's array does not carry is not a team level with the leader.
  it("dashes games back for a team only one of the two reads knows", () => {
    const partial: RawStandings = (standingsArray as RawStandings).slice(0, 1);
    expect(mapStandings(standingsPage as RawStandingsPage, partial).map((r) => r.gamesBack)).toEqual(
      [0, null, null, null],
    );
  });
});
