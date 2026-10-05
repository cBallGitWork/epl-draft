// `getStandings` on the fxpa surface — the standings page Fantrax draws for its
// own site, read by `mapStandings` for the table.
//
// Two methods share that name and they are not the same read. fxea's answers a
// plain array of table rows; this one answers the page, and the page is where
// the league's own POINTS live — three for a win here. The fxea array carries the
// record as one unsplit string and no points column at all.
//
// It needs no cookie. Probed anonymously against both leagues on 29 Aug 2026,
// mid-gameweek-2 with results in it, which is the state that proved the columns.

/** One header cell. `key` is the column's name in Fantrax's own vocabulary —
 *  `win`, `draw`, `loss`, `points` — and reading by it rather than by position
 *  is what stops a reordered table being read as the wrong numbers. */
export interface RawTableHeaderCell {
  key?: string;
}

/** One body cell. Only the ones naming a team carry a `teamId`, which is how a
 *  row says whose it is without the column order being known. */
export interface RawTableCell {
  content?: string;
  teamId?: string;
}

export interface RawTableRow {
  cells?: RawTableCell[];
  /** The columns Fantrax pins to the left of its own scrolling table: rank, then
   *  the team. Their header is `fixedHeader`, not `header`. */
  fixedCells?: RawTableCell[];
}

export interface RawStandingsTable {
  /** "Standings" for the table, "Gameweek 2" for the results below it. Not what
   *  the table is FOUND by — see `mapStandings` — because a caption is a
   *  display string and the keys are not. */
  caption?: string;
  fixedHeader?: { cells?: RawTableHeaderCell[] };
  header?: { cells?: RawTableHeaderCell[] };
  rows?: RawTableRow[];
}

export interface RawStandingsPage {
  /** The standings table first, then one table per played round. A league with
   *  no teams still answers the standings table, with no rows in it. */
  tableList?: RawStandingsTable[];
}
