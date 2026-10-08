import type { ScoringCategory } from "./scoring";
import { wordsOf } from "./categoryWords";
import type { LivePlayerCategory } from "./points";

// Why a player is on his number, by the league's own scoring categories: read from Fantrax, never computed.

/** One category's contribution to a player's total. */
export interface BreakdownLine {
  /** Fantrax's short label — "CS", "GAO", "Sv". */
  code: string;
  /** The category in plain words: "Assists", never their "Assists (Total)". */
  name: string;
  /** Points, theirs. Signed: goals against and cards arrive negative. */
  points: number;
  /** What he did to earn them, as Fantrax renders it ("90" against Minutes Played); null where it stated none. */
  value: string | null;
}

/** The live scoreboard's breakdown, priced at the roster slot. A category the league did not describe is
 *  dropped, never shown as `5010#6090`, and a missing table (a cached `LeagueInfo` from an older deploy) names
 *  nothing rather than throwing. */
export function liveBreakdown(
  categories: readonly LivePlayerCategory[],
  names: Record<string, ScoringCategory> | undefined,
): BreakdownLine[] {
  return categories
    .flatMap((category) => {
      const named = names?.[category.category];
      if (named === undefined) return [];
      return [
        {
          code: named.code,
          name: wordsOf(named).name,
          points: category.points,
          value: category.value,
        },
      ];
    })
    .sort((a, b) => b.points - a.points);
}

/** One man's part in one category, by id alone: the app puts the name to him. */
export interface CategoryMan {
  fantraxId: string;
  /** Signed, as `BreakdownLine` is. */
  points: number;
}

/** One scoring category with the men on each side who registered it. */
export interface CategoryBand {
  code: string;
  name: string;
  /** The side the URL named, then his opponent; empty where that side registered nothing, never noughts. */
  mine: CategoryMan[];
  theirs: CategoryMan[];
}

/** One side's men, by category; a category nobody registered is not a key. */
function menByCategory(
  breakdowns: Record<string, readonly BreakdownLine[]>,
): Map<string, { name: string; men: CategoryMan[] }> {
  const byCode = new Map<string, { name: string; men: CategoryMan[] }>();
  for (const [fantraxId, lines] of Object.entries(breakdowns)) {
    for (const line of lines) {
      const had = byCode.get(line.code);
      const band = had ?? { name: line.name, men: [] };
      band.men.push({ fantraxId, points: line.points });
      if (had === undefined) byCode.set(line.code, band);
    }
  }
  return byCode;
}

/** A side's figure in one band, or null where it registered nothing: a sum of no men is not 0. */
function total(men: readonly CategoryMan[]): number | null {
  return men.length === 0 ? null : men.reduce((sum, man) => sum + man.points, 0);
}

/** Both squads' scoring by category, the union of the two, largest combined magnitude first; men by points,
 *  ties on `fantraxId` (a caller with names re-sorts those). A gated side must arrive as `{}`: its bands alone
 *  would leak which categories his eleven registered, so a caller that "fixes" the asymmetry breaks the gate. */
export function bandCategories(
  mine: Record<string, readonly BreakdownLine[]>,
  theirs: Record<string, readonly BreakdownLine[]>,
): CategoryBand[] {
  const left = menByCategory(mine);
  const right = menByCategory(theirs);
  const ranked = (men: readonly CategoryMan[] | undefined): CategoryMan[] =>
    [...(men ?? [])].sort(
      (a, b) => b.points - a.points || a.fantraxId.localeCompare(b.fantraxId),
    );

  return [...new Set([...left.keys(), ...right.keys()])]
    .map((code) => ({
      code,
      // The name as the reader's own side spells it, then his opponent's, then the code.
      name: (left.get(code) ?? right.get(code))?.name ?? code,
      mine: ranked(left.get(code)?.men),
      theirs: ranked(right.get(code)?.men),
    }))
    .sort((a, b) => {
      const weight = weigh(b) - weigh(a);
      return weight !== 0 ? weight : a.code.localeCompare(b.code);
    });
}

/** How much a band moved the scoreline, for the ordering; an absence weighs nothing. */
function weigh(band: CategoryBand): number {
  return Math.abs(total(band.mine) ?? 0) + Math.abs(total(band.theirs) ?? 0);
}
