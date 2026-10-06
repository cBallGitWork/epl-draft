// `getStandings` on fxpa: the cookieless standings page `mapStandings` reads, where the league's POINTS live.
// fxea's method of the same name is a different read: a plain array with the record as one string and no points.

/** One header cell; `key` (`win`, `draw`, `loss`, `points`) is read, never position, so a reordered table reads right. */
export interface RawTableHeaderCell {
  key?: string;
}

/** One body cell; only team cells carry a `teamId`, which says whose row it is. */
export interface RawTableCell {
  content?: string;
  teamId?: string;
}

export interface RawTableRow {
  cells?: RawTableCell[];
  /** The pinned left columns, rank then team, headed by `fixedHeader`, not `header`. */
  fixedCells?: RawTableCell[];
}

export interface RawStandingsTable {
  /** "Standings", or "Gameweek 2" for the results below; never what a table is found by. */
  caption?: string;
  fixedHeader?: { cells?: RawTableHeaderCell[] };
  header?: { cells?: RawTableHeaderCell[] };
  rows?: RawTableRow[];
}

export interface RawStandingsPage {
  /** The standings table, then one per played round; a teamless league still answers the first, empty. */
  tableList?: RawStandingsTable[];
}
