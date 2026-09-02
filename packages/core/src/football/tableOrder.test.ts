import { describe, expect, it } from "vitest";
import { defaultDescendingTable, isTableSortKey, placed, sortTable } from "./tableOrder";
import type { TableRow } from "./table";

const club = (over: Partial<TableRow>): TableRow => ({
  clubId: 1, code: 1, name: "Club", shortName: "CLB",
  played: 0, won: 0, drawn: 0, lost: 0,
  goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0, ...over,
});

// In the competition's own order, as `leagueTable` returns them.
const TABLE: TableRow[] = [
  club({ clubId: 1, name: "Arsenal", points: 6, goalsFor: 4, goalsAgainst: 0, goalDifference: 4, won: 2, played: 2 }),
  club({ clubId: 2, name: "Chelsea", points: 4, goalsFor: 5, goalsAgainst: 3, goalDifference: 2, won: 1, drawn: 1, played: 2 }),
  club({ clubId: 3, name: "Spurs", points: 0, goalsFor: 1, goalsAgainst: 7, goalDifference: -6, lost: 2, played: 2 }),
];

describe("tableOrder", () => {
  it("keeps the competition's own place through a re-ordering", () => {
    // Sorted by goals scored, Chelsea leads on 5 — and is still second.
    const rows = sortTable(placed(TABLE), "for", true);
    expect(rows.map((r) => r.row.name)).toEqual(["Chelsea", "Arsenal", "Spurs"]);
    expect(rows.map((r) => r.place)).toEqual([2, 1, 3]);
  });

  it("opens the columns you want least of the small way up", () => {
    expect(defaultDescendingTable("lost")).toBe(false);
    expect(defaultDescendingTable("against")).toBe(false);
    expect(defaultDescendingTable("place")).toBe(false);
    expect(defaultDescendingTable("pts")).toBe(true);
    expect(defaultDescendingTable("gd")).toBe(true);
  });

  it("breaks a tie on the table's own place, not on array order", () => {
    const level = [
      club({ clubId: 1, name: "First", points: 3, played: 2 }),
      club({ clubId: 2, name: "Second", points: 3, played: 2 }),
      club({ clubId: 3, name: "Third", points: 3, played: 2 }),
    ];
    // Every club level on the sorted column: the order must be the table's.
    expect(sortTable(placed(level), "pts", true).map((r) => r.place)).toEqual([1, 2, 3]);
    expect(sortTable(placed(level), "played", true).map((r) => r.place)).toEqual([1, 2, 3]);
  });

  it("sorts by place both ways without losing the place", () => {
    const up = sortTable(placed(TABLE), "place", false);
    expect(up.map((r) => r.place)).toEqual([1, 2, 3]);
    const down = sortTable(placed(TABLE), "place", true);
    expect(down.map((r) => r.place)).toEqual([3, 2, 1]);
    expect(down[0].row.name).toBe("Spurs");
  });

  it("orders by goal difference, negatives included", () => {
    expect(sortTable(placed(TABLE), "gd", true).map((r) => r.row.goalDifference)).toEqual([4, 2, -6]);
  });

  it("recognises a column and refuses anything else", () => {
    expect(isTableSortKey("pts")).toBe(true);
    expect(isTableSortKey("gd")).toBe(true);
    expect(isTableSortKey("rank")).toBe(false);
    expect(isTableSortKey(undefined)).toBe(false);
    // A stale shared link must not be able to reach into the prototype.
    expect(isTableSortKey("toString")).toBe(false);
  });

  it("does not disturb the array it was given", () => {
    const rows = placed(TABLE);
    sortTable(rows, "for", true);
    expect(rows.map((r) => r.row.name)).toEqual(["Arsenal", "Chelsea", "Spurs"]);
  });
});
