// What the commissioner set a category to be worth. Read from `getLeagueInfo`,
// never assumed: scoring is the most custom thing in a Fantrax league, and our
// two leagues already disagree about most of it.
//
// We do not score matches. Fantrax does that, publicly and authoritatively, and
// their numbers are what the app shows. This exists for the one thing their
// numbers cannot say yet — see `join/cleanSheets.ts`.

/** Keepers score differently enough that Fantrax keeps two tables. */
export interface ScoringRules {
  goalie: CategoryTable;
  outfield: CategoryTable;
  /** Which position letter the goalie table is for, as the payload's own group
   *  short name gives it. Null when Fantrax did not say, in which case a keeper
   *  scores nothing rather than an outfielder's points. */
  goaliePosition: string | null;
}

/** Category short name → position letter → points. `Default` is the wire's own
 *  fallback key and is kept verbatim rather than resolved at map time, because
 *  which position falls through to it is a question about a player, not a rule. */
export type CategoryTable = Record<string, Record<string, number>>;

/** The wire's fallback column, in its own spelling. */
const DEFAULT_POSITION = "Default";

/** What one category is worth to a player in one position.
 *
 *  Null when the rules do not cover it — an unparsed expression, a category this
 *  league does not score, or a keeper in a league that never named its keeper
 *  position. Null is not nought: a caller that cannot price something should say
 *  so rather than quietly count it as free. */
export function categoryPoints(
  rules: ScoringRules,
  category: string,
  position: string,
): number | null {
  const goalie = rules.goaliePosition !== null && position === rules.goaliePosition;
  const table = goalie ? rules.goalie : rules.outfield;
  const row = table[category];
  if (!row) return null;

  const exact = row[position];
  if (typeof exact === "number") return exact;

  const fallback = row[DEFAULT_POSITION];
  return typeof fallback === "number" ? fallback : null;
}
