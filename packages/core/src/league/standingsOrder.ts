import type { StandingsRow } from "./types";

// Reading the table in another column's order: sorts a copy and never touches `rank`, the team's real place.

/** One key per printed column; `rank`, the table's own place, is the default. */
export type SortKey = "rank" | "played" | "won" | "drawn" | "lost" | "for" | "against" | "pts";

/** Every sortable column's value, and the direction worth reading first: `rank`, `lost` and `against` ascend. */
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

/** `Object.hasOwn`, not `in`: a key from the URL like `toString` would pass `in` and 500 the page. */
export function isSortKey(value: string | undefined): value is SortKey {
  return value !== undefined && Object.hasOwn(COLUMN, value);
}

/** The natural direction for a column, so a first tap reads the useful way. */
export function defaultDescending(key: SortKey): boolean {
  return COLUMN[key].descending;
}

/** The rows in the asked-for order, ties on `rank` so level teams never reshuffle between refreshes. */
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
