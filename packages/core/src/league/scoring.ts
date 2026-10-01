// What the commissioner set a category to be worth. Read from `getLeagueInfo`,
// never assumed: scoring is the most custom thing in a Fantrax league, and our
// two leagues already disagree about most of it.
//
// We do not score matches. Fantrax does that, publicly and authoritatively, and
// their numbers are what the app shows. This exists for the one thing their
// numbers cannot say yet — see `join/cleanSheets.ts`.

/** What a scoring category is called, in the league's own words. Two leagues
 *  answer different vocabularies — ours scores Key Passes and Midfielder Points,
 *  the rehearsal league neither — so this is read and never written down. */
export interface ScoringCategory {
  /** Their short label: "G", "CS", "MP". */
  code: string;
  /** Their name for it: "Goals", "Clean Sheets On Field". */
  name: string;
  /** Their long code, "INDIVIDUAL_ASSISTS_TOTAL": what a category is, whatever a league calls it. Null when not sent. */
  longCode: string | null;
}

/** Keepers score differently enough that Fantrax keeps two tables. */
export interface ScoringRules {
  goalie: CategoryTable;
  outfield: CategoryTable;
  /** Which position letter the goalie table is for, as the payload's own group
   *  short name gives it. Null when Fantrax did not say, in which case a keeper
   *  scores nothing rather than an outfielder's points. */
  goaliePosition: string | null;
}

/** Category short name → position letter → points, or null where the wire priced
 *  the position with an expression we decline to read.
 *
 *  Null and absent mean different things, and conflating them is how a wrong
 *  number gets published: a position that is simply not listed falls through to
 *  `Default`, while one priced by a range we do not parse must not, because
 *  `Default` is a different rule that happens to be readable. `Default` itself is
 *  kept verbatim rather than resolved at map time — which position falls through
 *  to it is a question about a player, not about the rules. */
export type CategoryTable = Record<string, Record<string, number | null>>;

/** The clean-sheet category's short name in Fantrax's own scoring table. */
export const CLEAN_SHEET = "CS";

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

  // Listed-but-unpriced stops here rather than falling through: the wire did
  // price this position, we simply cannot read what it said, and `Default` is
  // somebody else's rule.
  if (position in row) return row[position];

  const fallback = row[DEFAULT_POSITION];
  return typeof fallback === "number" ? fallback : null;
}
