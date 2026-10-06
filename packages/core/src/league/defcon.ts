import { DEFCON, type FantraxCategory, firstScored } from "./categoryNames";
import { type LeagueScoring, pointsFor, priceOf, type ScoringCategory, type ScoringRules } from "./scoring";

// Our DefCon off the league's own bands: how near a man is at his slot, and a season priced match by match.

/** The DefCon categories a league scores, DFP before DFP3; none where it scores neither. */
export function defConScored(categories: Record<string, ScoringCategory>): FantraxCategory[] {
  return DEFCON.filter((category) => firstScored(categories, [category]) !== null);
}

/** The league's DefCon category at a slot, the count its first band starts at, and the count from which a man is close to it. */
interface DefConAt {
  short: string;
  mark: number;
  /** Half the mark, floored: a man is shown only once he gets close. */
  close: number;
}

/** Null where the league prices no DefCon at that slot, as it prices none for a keeper. */
export function defConAt(scoring: LeagueScoring, slot: string): DefConAt | null {
  for (const category of defConScored(scoring.categories)) {
    const price = priceOf(scoring.rules, category.short, slot);
    const first = price === null || typeof price === "number" ? undefined : price.bands[0];
    if (first !== undefined) return { short: category.short, mark: first.from, close: Math.floor(first.from / 2) };
  }
  return null;
}

/** One scoring period for one man, standing for his match while he plays once in it: the matches he played in it
 *  and each DefCon category's count, by its code. */
export interface DefConPeriod {
  played: number | null;
  counts: Readonly<Record<string, number | null>>;
}

/** His DefCon points at `slot` over some periods, each priced as one match (Fantrax pays DefCon per match), every category summed.
 *  Null when the rules price no DefCon at the slot, when he played in none of them, or when one held more than one
 *  of his matches or lacks a count: a count over two matches cannot be split back into them. */
export function defConPoints(
  rules: ScoringRules,
  categories: readonly string[],
  slot: string,
  periods: readonly DefConPeriod[],
): number | null {
  if (categories.every((category) => pointsFor(rules, category, slot, 0) === null)) return null;
  let total = 0;
  let played = false;
  for (const period of periods) {
    if (period.played === 0) continue;
    if (period.played === null || period.played > 1) return null;
    played = true;
    for (const category of categories) {
      const count = period.counts[category];
      if (count === null || count === undefined) return null;
      total += pointsFor(rules, category, slot, count) ?? 0;
    }
  }
  return played ? total : null;
}
