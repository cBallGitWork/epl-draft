import type { TableRow } from "./table";

// Reading the Premier League table in an order other than its own. Pure.
//
// **The table's own order is the table**, and nothing here is a second opinion
// about it: `leagueTable` returns the twenty in the competition's order — points,
// then goal difference, then goals scored — and a row's PLACE is its index in
// that list. Sorting by goals scored answers "who has scored most", not "who is
// third", so the rank a row carries never comes from here.
//
// `league/standingsOrder.ts` is the same shape for the other table and this is
// deliberately a copy rather than a shared generic (CODE_RULES §1: two
// occurrences are a coincidence). The two cannot share in any case — the layers
// may not import each other, and one of the two tables is Fantrax's arithmetic
// while this one is the competition's own.

/** Which column. `place` is the table's own order and the default. */
export type TableSortKey =
  | "place"
  | "played"
  | "won"
  | "drawn"
  | "lost"
  | "for"
  | "against"
  | "gd"
  | "pts";

/** Every sortable column's value, and the direction worth reading first.
 *
 *  A table is opened at the top, so most of these want the biggest first. Three
 *  do not: `place` counts upward from the leader, and `lost` and `against` are
 *  the columns you want the SMALLEST of — opening them descending would head the
 *  table with the worst side in the division.
 *
 *  `place` reads the row's position in the array it arrived in, which is the
 *  competition's own order, so it is passed in rather than read off the row.
 *  A `TableRow` carries no rank of its own precisely because the list IS the
 *  ranking (`table.ts`). */
const COLUMN: Record<
  TableSortKey,
  { of: (row: TableRow, place: number) => number; descending: boolean }
> = {
  place: { of: (_row, place) => place, descending: false },
  played: { of: (row) => row.played, descending: true },
  won: { of: (row) => row.won, descending: true },
  drawn: { of: (row) => row.drawn, descending: true },
  lost: { of: (row) => row.lost, descending: false },
  for: { of: (row) => row.goalsFor, descending: true },
  against: { of: (row) => row.goalsAgainst, descending: false },
  gd: { of: (row) => row.goalDifference, descending: true },
  pts: { of: (row) => row.points, descending: true },
};

/** `Object.hasOwn` and not `in`: `in` walks the prototype chain, so `toString`
 *  and `constructor` both pass it, and the column lookup that follows returns a
 *  function whose `.of` is undefined. A sort key arrives in a URL, which makes
 *  that a 500 anybody can type. */
export function isTableSortKey(value: string | undefined): value is TableSortKey {
  return value !== undefined && Object.hasOwn(COLUMN, value);
}

/** The natural direction for a column, so a first tap reads the useful way. */
export function defaultDescendingTable(key: TableSortKey): boolean {
  return COLUMN[key].descending;
}

/** A club and where the competition puts it. The place is fixed at the moment
 *  the table is computed and travels with the row through every re-ordering, so
 *  a table read by goals scored still says who is top of the league. */
export interface PlacedRow {
  row: TableRow;
  /** 1-based, and the table's own — never the position in the sorted list. */
  place: number;
}

/** Pair every row with its place, before anything re-orders them. */
export function placed(rows: readonly TableRow[]): PlacedRow[] {
  return rows.map((row, at) => ({ row, place: at + 1 }));
}

/** The rows in the asked-for order.
 *
 *  Ties fall back to the table's own place rather than to whatever order the
 *  array arrived in: half a division level on goals scored is the ordinary case
 *  in August, and a table that reshuffles level clubs between refreshes is one
 *  nobody trusts. */
export function sortTable(
  rows: readonly PlacedRow[],
  key: TableSortKey,
  descending: boolean,
): PlacedRow[] {
  const value = COLUMN[key].of;
  return [...rows].sort((a, b) => {
    const first = value(a.row, a.place);
    const second = value(b.row, b.place);
    const difference = descending ? second - first : first - second;
    return difference !== 0 ? difference : a.place - b.place;
  });
}
