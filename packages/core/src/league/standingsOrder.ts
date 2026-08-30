import type { StandingsRow } from "./types";

// Reading the table in an order other than Fantrax's. Pure.
//
// **Fantrax still computes the table.** The record, the points and the ranking
// are theirs and nothing here recomputes them — `row.rank` keeps saying where a
// team actually is, whatever order the rows are printed in. This is a way of
// reading the table, not a second opinion about it, which is why it sorts a
// copy and never touches `rank`.

/** Which column. `rank` is Fantrax's own order and the default. */
export type SortKey = "rank" | "record" | "gb" | "win" | "fp" | "pts";

/** Every sortable column's value, and the direction worth reading first.
 *
 *  A table is opened at the top: points, fantasy points and the win fraction all
 *  answer "who is best" and want the biggest first, while rank and games back
 *  already count upward from the leader. Making the caller pass a direction
 *  would put that judgement at every call site. */
const COLUMN: Record<SortKey, { of: (row: StandingsRow) => number; descending: boolean }> = {
  rank: { of: (row) => row.rank, descending: false },
  record: { of: (row) => row.won, descending: true },
  // A side Fantrax gives no games-back for sorts last either way rather than
  // ahead of the leader, which a nought would do.
  gb: { of: (row) => row.gamesBack ?? Number.POSITIVE_INFINITY, descending: false },
  win: { of: (row) => row.winPercentage ?? -1, descending: true },
  fp: { of: (row) => row.pointsFor, descending: true },
  pts: { of: (row) => row.points, descending: true },
};

export function isSortKey(value: string | undefined): value is SortKey {
  return value !== undefined && value in COLUMN;
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
