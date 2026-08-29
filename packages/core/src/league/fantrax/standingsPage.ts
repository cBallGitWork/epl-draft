// `getStandings` on the fxpa surface — the standings page Fantrax draws for its
// own site, and one payload carrying two things we want.
//
// Two methods share that name and they are not the same read. fxea's answers a
// plain array of table rows; this one answers the page, and the page is where
// the league's own POINTS live — three for a win here — along with the badge
// each manager picked. Neither is on the fxea array, which carries the record as
// one unsplit string and no points column at all.
//
// It needs no cookie. Probed anonymously against both leagues on 20 Aug 2026 for
// the badges and again on 29 Aug for the table, mid-gameweek-2 with results in
// it, which is the state that proved the columns.
//
// Two mappers read it — `mapStandings` for the table, `mapTeamBadges` for the
// badges — and the shapes live here rather than in either of them, so neither
// file describes half a payload it does not own.

/** Fantrax's own block, mirrored including the field that lies twice: the key
 *  says 512, the value it holds ends `_256.webp`, and 256 is the one size their
 *  image host does not serve. */
export interface RawFantasyTeamInfo {
  name?: string;
  logoUrl512?: string;
  shortName?: string;
}

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
  /** Keyed by team id. `{}` for a league nobody has joined, which is what our
   *  real league answers every day until 10 Oct. */
  fantasyTeamInfo?: Record<string, RawFantasyTeamInfo | undefined>;
  /** The standings table first, then one table per played round. A league with
   *  no teams still answers the standings table, with no rows in it. */
  tableList?: RawStandingsTable[];
}
