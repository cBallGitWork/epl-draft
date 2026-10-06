import type { TableRow } from "./table";

// The Premier League table read by another column; a row's place always stays its index in `leagueTable`'s order.
// `league/standingsOrder.ts` is the same shape (2 of 2); the layers may not import each other.

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

/** Every sortable column's value and its first direction: biggest first, except `place`, `lost` and `against`.
 *  `place` is passed in, since a `TableRow` carries no rank of its own. */
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

/** Whether a URL value is a sort key; `Object.hasOwn`, not `in`, or `?sort=toString` is a 500. */
export function isTableSortKey(value: string | undefined): value is TableSortKey {
  return value !== undefined && Object.hasOwn(COLUMN, value);
}

/** The natural direction for a column, so a first tap reads the useful way. */
export function defaultDescendingTable(key: TableSortKey): boolean {
  return COLUMN[key].descending;
}

/** A club and its place in the table, fixed before any re-ordering and carried through it. */
export interface PlacedRow {
  row: TableRow;
  /** 1-based, and the table's own — never the position in the sorted list. */
  place: number;
}

/** Pair every row with its place, before anything re-orders them. */
export function placed(rows: readonly TableRow[]): PlacedRow[] {
  return rows.map((row, at) => ({ row, place: at + 1 }));
}

/** The rows in the asked-for order, ties broken by the table's own place so level clubs never reshuffle. */
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
