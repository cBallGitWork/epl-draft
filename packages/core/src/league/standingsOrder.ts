import type { StandingsRow } from "./types";

// Reading the table in an order other than Fantrax's. Pure.
//
// **Fantrax still computes the table.** The record, the points and the ranking
// are theirs and nothing here recomputes them — `row.rank` keeps saying where a
// team actually is, whatever order the rows are printed in. This is a way of
// reading the table, not a second opinion about it, which is why it sorts a
// copy and never touches `rank`.

/** Which column. `rank` is Fantrax's own order and the default.
 *
 *  One key per printed column since 31 Aug 2026, where `record` used to stand
 *  for the whole `W-D-L` string and `gb`/`win` for two columns that are no
 *  longer drawn. A hyphenated record is one cell holding three numbers, and it
 *  can only ever be sorted by one of them — the table said `W-D-L` and ordered
 *  silently by wins. */
export type SortKey = "rank" | "played" | "won" | "drawn" | "lost" | "for" | "against" | "pts";

/** Every sortable column's value, and the direction worth reading first.
 *
 *  A table is opened at the top, so most of these want the biggest first: points
 *  and wins and fantasy points all answer "who is best". Three do not. `rank`
 *  counts upward from the leader. `lost` and `against` are the columns you want
 *  the SMALLEST of, and opening them descending would put the worst side in the
 *  league at the top of a table headed by the best. Making the caller pass a
 *  direction would put that judgement at every call site. */
const COLUMN: Record<SortKey, { of: (row: StandingsRow) => number; descending: boolean }> = {
  rank: { of: (row) => row.rank, descending: false },
  played: { of: (row) => row.played, descending: true },
  won: { of: (row) => row.won, descending: true },
  drawn: { of: (row) => row.drawn, descending: true },
  lost: { of: (row) => row.lost, descending: false },
  for: { of: (row) => row.pointsFor, descending: true },
  against: { of: (row) => row.pointsAgainst, descending: false },
  pts: { of: (row) => row.points, descending: true },
};

/** `Object.hasOwn` and not `in`: `in` walks the prototype chain, so `toString`
 *  and `constructor` both pass it, and `COLUMN[key].of` is then undefined rather
 *  than a reader. A sort key arrives in a URL, which made that a 500 anybody
 *  could type — `/league?sort=toString`. */
export function isSortKey(value: string | undefined): value is SortKey {
  return value !== undefined && Object.hasOwn(COLUMN, value);
}

/** The natural direction for a column, so a first tap reads the useful way. */
export function defaultDescending(key: SortKey): boolean {
  return COLUMN[key].descending;
}

/** The rows in the asked-for order.
 *
 *  Ties fall back to Fantrax's rank rather than to whatever order the array
 *  arrived in: two sides level on points is the ordinary case in a sixteen-team
 *  league, and a table that reshuffles level teams between refreshes is one a
 *  manager stops trusting. */
export function sortRows(
  rows: readonly StandingsRow[],
  key: SortKey,
  descending: boolean,
): StandingsRow[] {
  const value = COLUMN[key].of;
  return [...rows].sort((a, b) => {
    const difference = descending ? value(b) - value(a) : value(a) - value(b);
    return difference !== 0 ? difference : a.rank - b.rank;
  });
}
