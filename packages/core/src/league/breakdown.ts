import type { ScoringCategory } from "./scoring";
import { wordsOf } from "./categoryWords";
import type { LivePlayerCategory } from "./points";
import type { StatColumn, StatLine } from "./stats";

// Why a player is on the number he is on, in our league's own scoring
// categories.
//
// Read, never computed. `getTeamRosterInfo` with `view: "FPTS"` re-renders each
// stat column as the points that category contributed, and they sum to the
// total exactly — verified on 30 of 30 rows across two teams (PLATFORM_NOTES,
// 13 Aug). Our own engine could only ever have approximated the five categories
// FPL does not publish, so a breakdown of ours would have had to carry a caveat
// on every line. This one carries none.
//
// Here rather than in either of its readers because two of them pair the same
// two arrays and split the same string: the player profile's season table, and
// the live card on the head-to-head board — which now reaches it by the other
// door below, since the live scoreboard names its categories rather than
// heading them.

/** One category's contribution to a player's total. */
export interface BreakdownLine {
  /** Fantrax's short label — "CS", "GAO", "Sv". */
  code: string;
  /** The category in plain words: "Assists", never their "Assists (Total)". */
  name: string;
  /** Their own definition of it, which is where this league's rules are
   *  published — what counts as a clean sheet is their sentence, not ours. Null
   *  for the categories they define by their name alone. */
  definition: string | null;
  /** Points, theirs. Signed: goals against and cards arrive negative. */
  points: number;
  /** What he DID to earn them, as Fantrax renders it — "90" against Minutes
   *  Played, "1" against Goals.
   *
   *  Null from the season table and never from the live card, and the asymmetry
   *  is the provider's: `getTeamRosterInfo`'s FPTS view re-renders every stat
   *  column AS its points, so the count is the one thing that view has spent.
   *  The live payload carries both side by side. */
  value: string | null;
}

/** Where their prose definition starts inside a column's long name.
 *  "Clean Sheets On Field -- Awarded to a player who…" is one label and one
 *  paragraph, and only the label fits anywhere we print it. */
const DEFINITION = " -- ";

/** A column's label and the rule behind it, cut apart.
 *
 *  Exported because the third reader is a column HEAD rather than a line: the
 *  squad's season grid prints thirteen of these across the top of a table and
 *  hangs Fantrax's own sentence off each one. The two below ask the same question
 *  of a value. This is the only place in the app where the league's scoring rules
 *  are published in prose, and they are published on a stat table's header and
 *  nowhere else — not on `getLeagueInfo`. */
export function columnLabel(column: StatColumn): { name: string; definition: string | null } {
  const at = column.name.indexOf(DEFINITION);
  const label = at < 0 ? column.name : column.name.slice(0, at);
  return {
    name: wordsOf({ code: column.code, name: label, longCode: null }).name,
    definition: at < 0 ? null : column.name.slice(at + DEFINITION.length).trim() || null,
  };
}

/** One player's categories, largest contribution first.
 *
 *  Nothing and nought are both dropped, and they arrive as both: Fantrax prints
 *  a bare dash for a category a player never registered, which the mapper reads
 *  as null, and a real 0 for one that returned nothing. Neither is a line worth
 *  a row. Games played falls out here too — in the FPTS view it renders as 0,
 *  because a count of appearances is not a score, which is also why it is not in
 *  the sum. */
export function breakdownOf(columns: readonly StatColumn[], line: StatLine): BreakdownLine[] {
  return line.values
    .flatMap((points, index) => {
      const column = columns[index];
      if (points === null || points === 0 || column === undefined) return [];
      // No count here by construction: this view's cells ARE the points.
      return [{ code: column.code, ...columnLabel(column), points, value: null }];
    })
    .sort((a, b) => b.points - a.points);
}


/** The same question asked of the live scoreboard, where the numbers are priced
 *  at the roster slot rather than at a player's default position.
 *
 *  Two things it cannot do that `breakdownOf` can, and both are honest losses.
 *  Fantrax's prose definition — "Clean Sheets On Field -- Awarded to a player who
 *  played at least 60 minutes…" — is published on the stat table's header and not
 *  on `getLeagueInfo`, so `definition` is null here; the sentence still reaches a
 *  reader on the player's own page. And a category this league did not describe
 *  is dropped rather than printed, because the alternative is a row headed
 *  `5010#6090`, and an identifier on screen is worse than a line missing from a
 *  list that never claimed to be complete.
 *
 *  **No table at all is the same answer as a table naming nothing**, and it is a
 *  state that really arrives: `LeagueInfo` is cached, so a deploy that adds a
 *  field to it can be handed an object written by the deploy before, without
 *  that field on it. A breakdown is the one thing on the card that may go
 *  missing without lying — the total beside it is Fantrax's either way — so it
 *  degrades rather than throwing the page away. */
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
          definition: null,
          points: category.points,
          value: category.value,
        },
      ];
    })
    .sort((a, b) => b.points - a.points);
}

/** One man's part in one category. **No name**: this layer holds Fantrax's
 *  `fantraxId` and nothing else about a person, and the roster that can put a
 *  name to him lives in the app. A core that knew names would be a core that
 *  could leak one. */
export interface CategoryMan {
  fantraxId: string;
  /** Signed, as `BreakdownLine` is. */
  points: number;
}

/** One scoring category with the men on each side who registered it. */
export interface CategoryBand {
  code: string;
  name: string;
  /** The side the URL named, then his opponent.
   *
   *  **EMPTY where that side registered nothing, and empty is the absence.** The
   *  band is on the board because the OTHER side registered it, and a side of
   *  noughts is a claim the payload never made. */
  mine: CategoryMan[];
  theirs: CategoryMan[];
}

/** One side's men, by category.
 *
 *  Absence stays absence: a category nobody registered is not a key here, and so
 *  is never printed as a nought. What reaches this has already been filtered by
 *  `liveBreakdown` — a man with no entry, and a category this league did not
 *  describe, are both gone before the sum. */
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

/** A side's figure in one band, or null where it registered nothing.
 *
 *  `[]` IS the absence (DESIGN §7), which is the whole reason this is a function
 *  and not a `reduce` at the call site: a sum of no men is 0 in arithmetic and
 *  silence on a scoresheet, and only one of those is true here. */
function total(men: readonly CategoryMan[]): number | null {
  return men.length === 0 ? null : men.reduce((sum, man) => sum + man.points, 0);
}

/** Both squads' scoring, category by category, **with the men behind each**.
 *
 *  **The union of the two, never one side's list**: a category only his keeper registered is a band with an empty
 *  half, which is the honest shape. Largest combined magnitude first, deductions at the foot; ties on the code.
 *
 *  **Men in a band are ordered by points, largest first**, which is
 *  `liveBreakdown`'s own order one level up. Ties break on `fantraxId` — which is
 *  meaningless to a reader and is meant to be: it exists so two renders of one
 *  payload agree, and a caller with names should re-sort equal points by the name
 *  it can see. Ties are the common case here, because every scorer of one goal is
 *  on the same figure.
 *
 *  **THE GATE RUNS THROUGH THIS FUNCTION, and it runs through its ARGUMENTS.**
 *  A category figure names a man in the eleven, which is the exact fact the
 *  lineup gate withholds before a deadline (`PLATFORM_NOTES`). Nothing here can
 *  enforce that; what protects it is that a gated side's breakdown is never
 *  fetched, so it arrives as `{}` and contributes no band and no name. The union
 *  is the leak vector: handing this both sides unconditionally would make the
 *  BAND SET itself a statement about which categories his eleven registered, even
 *  with every name stripped. A caller that "fixes" the asymmetry breaks the gate.
 */
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
      // The name as the reader's own side spells it, then his opponent's, then
      // the code — which is what the pair above did before it was derived.
      name: (left.get(code) ?? right.get(code))?.name ?? code,
      mine: ranked(left.get(code)?.men),
      theirs: ranked(right.get(code)?.men),
    }))
    .sort((a, b) => {
      const weight = weigh(b) - weigh(a);
      return weight !== 0 ? weight : a.code.localeCompare(b.code);
    });
}

/** How much a band moved the scoreline, for the ordering. An absence weighs
 *  nothing, which is the one thing it can honestly be said to do. */
function weigh(band: CategoryBand): number {
  return Math.abs(total(band.mine) ?? 0) + Math.abs(total(band.theirs) ?? 0);
}
