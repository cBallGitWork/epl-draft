import { pointsFor, type ScoringRules } from "./scoring";

// DefCon points worked out by us: Fantrax pays DefCon per match, so a season is each match's count priced on its own.
// A scoring period stands for his match, which holds while he plays once in it.

/** One scoring period for one man: the matches he played in it and each DefCon category's count, by its code. */
export interface DefconPeriod {
  played: number | null;
  counts: Readonly<Record<string, number | null>>;
}

/** His DefCon points at `slot` over some periods, each priced as one match, every DefCon category summed.
 *  Null when the rules price no DefCon at the slot, when he played in none of them, or when one held more than one
 *  of his matches or lacks a count: a count over two matches cannot be split back into them. */
export function defconPoints(
  rules: ScoringRules,
  categories: readonly string[],
  slot: string,
  periods: readonly DefconPeriod[],
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
