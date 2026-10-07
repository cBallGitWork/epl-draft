// The league layer's stat vocabulary: a season's numbers as read from Fantrax, never computed.

/** Which set of numbers Fantrax answered with, since it defaults to a projection for an unplayed season. */
export interface StatSeason {
  /** Their code, e.g. `SEASON_926_YEAR_TO_DATE`. */
  code: string;
  /** Their label, e.g. "2026-27 - YTD", shown verbatim. */
  name: string;
  /** True when these are projected numbers rather than played ones. */
  projected: boolean;
}

/** One column of a stat table: the served league's own scoring vocabulary, never a fixed list. */
export interface StatColumn {
  /** Fantrax's short label — "CS", "GAO", "Sv". */
  code: string;
  /** Their long name, which for most categories carries their own definition after a double dash. */
  name: string;
}

/** One player's season in our league, as Fantrax scores it, by id alone: the pool names him. */
export interface StatLine {
  fantraxId: string;
  /** Fantasy points, theirs. Null when they gave none — not nought. */
  points: number | null;
  perGame: number | null;
  /** One value per column of the owning group, in order; null where Fantrax printed a dash. */
  values: (number | null)[];
}

/** A scoring group ("Goalkeeper", "Outfielder") with its own columns; flattened, saves would sit under goals against. */
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
  /** What share of all Fantrax leagues roster him, 0–100: their whole product, not our league. */
  rostered: number | null;
  /** How that share moved since last week, positive or negative. */
  trend: number | null;
  /** His fixture in Fantrax's own words (`"COV 0 @ARS 3 F"`, `"BOU Sun 9:00AM"`), `<br/>` made a space; never parsed. */
  opponent: string | null;
  /** The position his points are scored at: the last he is eligible for ("F" for "M,F"). */
  position: string | null;
}

/** `getPlayerStats` for the whole pool. */
export interface PoolStats {
  season: StatSeason;
  rows: PoolStatRow[];
  /** How many players Fantrax says it has, so a short page can say so; null when it did not say. */
  total: number | null;
  /** The current season's year-to-date code, read from Fantrax's list and never written down; null when absent. */
  yearToDate: string | null;
  /** The same season's per-date code (`SEASON_926_BY_DATE`), for one day's numbers; read like `yearToDate`. */
  byDate: string | null;
}
