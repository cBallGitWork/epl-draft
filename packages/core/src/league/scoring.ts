// What the commissioner set a category to be worth, read from `getLeagueInfo` and never assumed.
// Fantrax's own points are what the app prints; these price only what the app works out itself.

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

/** One band of a tiered price: `points` for a match's count from `from` to `to`, or for every `every` of it. */
export interface Band {
  from: number;
  to: number;
  points: number;
  every: number | null;
}

/** A price in bands. Cumulative bands stack, so a count earns every band it reaches; otherwise only its own. */
export interface Tiers {
  bands: readonly Band[];
  cumulative: boolean;
}

/** Points per unit, or bands. */
export type Price = number | Tiers;

/** Category short name → position letter → price, or null where the wire priced
 *  the position with an expression we decline to read.
 *
 *  Null and absent mean different things: a position not listed falls through to
 *  `Default`, while one listed but unreadable must not, because `Default` is a
 *  different rule that happens to be readable. */
export type CategoryTable = Record<string, Record<string, Price | null>>;

/** The scoring the app prices its own points by: one league's rules and its names for them. */
export interface LeagueScoring {
  rules: ScoringRules;
  categories: Record<string, ScoringCategory>;
}

/** The clean-sheet category's short name in Fantrax's own scoring table. */
export const CLEAN_SHEET = "CS";

/** The wire's fallback column, in its own spelling. */
const DEFAULT_POSITION = "Default";

/** What a slot earns for one match's count in one category: `count` at a flat price, or the bands it reaches.
 *  Null when the rules do not cover it. The top band has no ceiling, as "60+" and "5+" have none. */
export function pointsFor(rules: ScoringRules, category: string, position: string, count: number): number | null {
  const price = priceOf(rules, category, position);
  if (price === null) return null;
  if (typeof price === "number") return count === 0 ? 0 : price * count;
  const last = price.bands.length - 1;
  return price.bands.reduce((sum, band, i) => {
    const reached = i === last ? count : Math.min(count, band.to);
    if (count < band.from || (!price.cumulative && reached < count)) return sum;
    return sum + (band.every === null ? band.points : Math.floor((reached - band.from + 1) / band.every) * band.points);
  }, 0);
}

/** One category's price at one position; null when the rules do not cover it. */
function priceOf(rules: ScoringRules, category: string, position: string): Price | null {
  const goalie = rules.goaliePosition !== null && position === rules.goaliePosition;
  const row = (goalie ? rules.goalie : rules.outfield)[category];
  if (!row) return null;
  // A listed position stops here even when unreadable: `Default` is somebody else's rule.
  return position in row ? row[position] : (row[DEFAULT_POSITION] ?? null);
}

/** What one unit of a category is worth to a player in one position, where the price is flat.
 *
 *  Null when the rules do not cover it: a banded price, an unread expression, a category this league does not
 *  score, or a keeper in a league that never named its keeper position. Null is not nought. */
export function categoryPoints(rules: ScoringRules, category: string, position: string): number | null {
  const price = priceOf(rules, category, position);
  return typeof price === "number" ? price : null;
}

/** The categories a goal, an assist and a clean sheet arrive under; a league prices only its own (`AT`, or `A` and `AF`). */
const ATTACKING = ["G", "AT", "A", "AF"];

/** What his goals and assists, and his clean sheet, were worth to him; a category the league does not price adds nothing. */
export function returnPoints(
  counts: Readonly<Record<string, number | null | undefined>>,
  rules: ScoringRules,
  position: string,
): { attacking: number; cleanSheet: number } {
  const worth = (category: string) => (counts[category] ?? 0) * (categoryPoints(rules, category, position) ?? 0);
  return { attacking: ATTACKING.reduce((sum, c) => sum + worth(c), 0), cleanSheet: worth(CLEAN_SHEET) };
}
