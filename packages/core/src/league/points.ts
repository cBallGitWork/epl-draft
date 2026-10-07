// What a squad and its men are worth in one period, by Fantrax: read, never computed, printed only as theirs.

/** What one squad has scored in one period, according to Fantrax. */
export interface LiveTeamScore {
  teamId: string;
  /** Null when Fantrax did not give a total. Absence is not nought. */
  points: number | null;
  /** Active players whose fixture has not finished, or null; names nobody, so it passes a closed lineup gate. */
  toPlay: number | null;
}

/** What Fantrax reckons a squad will score in an unplayed period; never printed as a total. */
export interface TeamProjection {
  teamId: string;
  /** Null when Fantrax projected nothing for this squad, never nought. */
  points: number | null;
}

/** What one player scored in one period, priced at the roster slot his manager chose, not his default position. */
export interface LivePlayerPoints {
  fantraxId: string;
  /** His total; a man with no football behind him is absent from the list, never nought. */
  points: number;
  /** The categories that moved his total, for a breakdown. */
  categories: LivePlayerCategory[];
  /** Every category Fantrax stated a count for, noughts included, for a stat board. */
  counts: LivePlayerCategory[];
}

/** One category's contribution, by Fantrax's own ids; the names are a league setting from `getLeagueInfo`. */
export interface LivePlayerCategory {
  /** `"{groupId}#{categoryId}"`. */
  category: string;
  /** Points, theirs. Signed: cards and goals against arrive negative. */
  points: number;
  /** What he did, as Fantrax renders it ("90" minutes); null where they priced it without a count. */
  value: string | null;
}

/** One squad's priced players for one period; an array, since a Map does not survive the cache. */
export interface LiveSquadPoints {
  teamId: string;
  players: LivePlayerPoints[];
}

