import { DEFCON, firstScored } from "./categoryNames";
import { type LeagueScoring, priceOf } from "./scoring";

// Our DefCon at one slot, read off the league's own bands rather than assumed.

/** The league's DefCon category at a slot, the count its first band starts at, and the count from which a man is close to it. */
export interface DefConAt {
  short: string;
  mark: number;
  /** Half the mark, floored (Craig, 1 Oct 2026: "only show when they get close"). */
  close: number;
}

/** Null where the league prices no DefCon at that slot, as it prices none for a keeper. */
export function defConAt(scoring: LeagueScoring, slot: string): DefConAt | null {
  for (const category of DEFCON) {
    if (firstScored(scoring.categories, [category]) === null) continue;
    const price = priceOf(scoring.rules, category.short, slot);
    const first = price === null || typeof price === "number" ? undefined : price.bands[0];
    if (first !== undefined) return { short: category.short, mark: first.from, close: Math.floor(first.from / 2) };
  }
  return null;
}
