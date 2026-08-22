// The league layer's stat vocabulary: what a season's numbers look like once
// they are read back out of whoever is running our competition.
//
// Separate from `types.ts` for the same reason `scoring.ts` is — that file is
// the competition's shape (who is in it, what a roster may hold, who plays
// whom) and this one is its arithmetic. They change for different reasons and
// together they crossed the file ceiling.
//
// Nothing here computes anything. Our own engine could only ever have
// approximated the five categories FPL does not publish, and Fantrax computes
// the number that decides the match, so these types describe numbers we read.

/** Which set of numbers Fantrax answered with.
 *
 *  Carried on every stat read and rendered beside the numbers, because Fantrax
 *  defaults every one of these endpoints to a PROJECTION for a season nobody has
 *  played. A projection and a season total are different claims, and a column
 *  headed "FPts" that silently switches between them is the confident wrong
 *  answer. What we asked for is not the question — this is what came back. */
export interface StatSeason {
  /** Their code, e.g. `SEASON_926_YEAR_TO_DATE`. */
  code: string;
  /** Their label, e.g. "2026-27 - YTD". Shown verbatim: naming the season is
   *  their business, and ours would go stale in August. */
  name: string;
  /** True when these are projected numbers rather than played ones. */
  projected: boolean;
}

/** One column of a stat table: the league's own scoring vocabulary.
 *
 *  Never a fixed list. The real league scores five categories FPL does not
 *  publish and the rehearsal league scores none of them, so the columns are read
 *  from whichever league we are serving. */
export interface StatColumn {
  /** Fantrax's short label — "CS", "GAO", "Sv". */
  code: string;
  /** Their long name, which for most categories carries their own definition
   *  after a double dash. This is where their clean-sheet rule is published. */
  name: string;
}

/** One player's season in our league, as Fantrax scores it.
 *
 *  Identified, not described. His name and club are on the same wire row and are
 *  deliberately not carried: every caller already holds the pool, which names him
 *  properly, and a second copy is a copy that disagrees when a commissioner
 *  renames somebody. */
export interface StatLine {
  fantraxId: string;
  /** Fantasy points, theirs. Null when they gave none — not nought. */
  points: number | null;
  perGame: number | null;
  /** One value per column of the owning group, in the same order and always the
   *  same length. Null where Fantrax printed a dash, which it does for a
   *  category a player has not registered rather than printing a zero. */
  values: (number | null)[];
}

/** A scoring group — "Goalkeeper", "Outfielder" — with its own columns.
 *
 *  Fantrax tables the two separately because they score differently, and that
 *  split is the same one `ScoringRules` carries. Flattening them would put a
 *  keeper's saves under an outfielder's goals-against. */
export interface StatGroup {
  name: string;
  columns: StatColumn[];
  lines: StatLine[];
}

/** One team's squad with a season's numbers against each player. */
export interface TeamStats {
  season: StatSeason;
  groups: StatGroup[];
}

/** One row of the league-wide player table. */
export interface PoolStatRow {
  fantraxId: string;
  /** Fantrax's own ranking by fantasy points across the whole pool. */
  rank: number | null;
  points: number | null;
  perGame: number | null;
  /** What share of all Fantrax leagues roster him, 0–100. Their number about
   *  their whole product, not about ours — which is exactly what makes it worth
   *  printing: it is the only outside opinion on this page. */
  rostered: number | null;
  /** How that share moved since last week, positive or negative. */
  trend: number | null;
  /** His fixture, in Fantrax's own words — `"COV 0 @ARS 3 F"` once it has been
   *  played, `"BOU Sun 9:00AM"` before. Their formatting, with the literal
   *  `<br/>` they put in the middle turned into a space and nothing else
   *  interpreted: parsing a scoreline out of it would be inventing a format they
   *  never documented, and the football layer already models fixtures properly
   *  for every screen that needs them as data rather than as a line of text. */
  opponent: string | null;
}

/** `getPlayerStats` for the whole pool. */
export interface PoolStats {
  season: StatSeason;
  rows: PoolStatRow[];
  /** How many players Fantrax says it has, against however many it sent. The
   *  read asks for one page big enough to hold the pool, and this is what lets
   *  a page that did not get all of them say so instead of quietly showing a
   *  prefix. Null when Fantrax did not say. */
  total: number | null;
  /** The code for this league's current season, year to date — the one to ask
   *  the other stat reads for. Read from the list Fantrax publishes rather than
   *  written down: a literal would need editing every August, and this is the
   *  only endpoint that publishes the list. Null when it offered none. */
  yearToDate: string | null;
}
