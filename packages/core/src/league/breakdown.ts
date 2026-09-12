import type { ScoringCategory } from "./scoring";
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
  /** Their name for the category. */
  name: string;
  /** Their own definition of it, which is where this league's rules are
   *  published — what counts as a clean sheet is their sentence, not ours. Null
   *  for the categories they define by their name alone. */
  definition: string | null;
  /** Points, theirs. Signed: goals against and cards arrive negative. */
  points: number;
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
  if (at < 0) return { name: column.name.trim() || column.code, definition: null };
  return {
    name: column.name.slice(0, at).trim() || column.code,
    definition: column.name.slice(at + DEFINITION.length).trim() || null,
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
      return [{ code: column.code, ...columnLabel(column), points }];
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
      return [{ code: named.code, name: named.name, definition: null, points: category.points }];
    })
    .sort((a, b) => b.points - a.points);
}

/** One scoring category, as the two sides of a head-to-head answered it.
 *
 *  A row of the board that explains a scoreline: not who is in the eleven, which
 *  the pitch and the list already say, but which of the eleven categories the
 *  margin came out of. */
export interface CategoryPair {
  code: string;
  name: string;
  /** The side the URL named, then his opponent. Signed, as `BreakdownLine` is —
   *  cards and goals against arrive negative and stay that way.
   *
   *  **Null where that side registered the category at all, which is not nought**
   *  (DESIGN §7). The row exists because the OTHER side registered it, and
   *  filling this half with a 0 is a claim the payload never made: `liveBreakdown`
   *  has already dropped a category a man did not register, so what reaches here
   *  is silence and not a counted nothing. It shipped as `?? 0` for an hour and
   *  `register-warden` caught it — the same commit argued the rule at board level
   *  and broke it per row. */
  mine: number | null;
  theirs: number | null;
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

/** One scoring category with the men on each side who registered it.
 *
 *  `CategoryPair` is this band SUMMED — the same object read two ways, which is
 *  why `compareCategories` below is a projection of `bandCategories` rather than
 *  a second walk of the same data. A board of totals and a board of the men
 *  behind them can then never disagree about which categories exist or in what
 *  order. */
export interface CategoryBand {
  code: string;
  name: string;
  /** The side the URL named, then his opponent.
   *
   *  **EMPTY where that side registered nothing, and empty is the absence.** The
   *  band is on the board because the OTHER side registered it, and a side of
   *  noughts is a claim the payload never made — the same rule `CategoryPair.mine`
   *  states one level up, where `[]` becomes `null` rather than `0`. */
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

/** Both squads' scoring, category by category, in one list of rows.
 *
 *  **The union of the two, never one side's list.** A category only his keeper
 *  registered is a row with a dash on your half — which is the honest shape, and
 *  the reason this is a join rather than two independent boards: a row missing
 *  from one side reads as nought when the sides are drawn apart, and a nought is
 *  a claim the payload did not make.
 *
 *  Largest combined magnitude first, so the categories that decided it are at the
 *  top and the deductions collect at the foot — `liveBreakdown`'s own order, one
 *  level up. Ties break on the code so the board does not reshuffle between two
 *  renders of the same numbers.
 *
 *  Pure, and it has to be: this is the arithmetic under a number a manager will
 *  argue about. Fantrax's figures go in and a sum of them comes out — which makes
 *  the total OURS, and is why no column of it may be headed `FPts`. */
export function compareCategories(
  mine: Record<string, readonly BreakdownLine[]>,
  theirs: Record<string, readonly BreakdownLine[]>,
): CategoryPair[] {
  return bandCategories(mine, theirs).map((band) => ({
    code: band.code,
    name: band.name,
    mine: total(band.mine),
    theirs: total(band.theirs),
  }));
}

/** Both squads' scoring, category by category, **with the men behind each**.
 *
 *  Everything `compareCategories` says about the union, the order and the
 *  absence holds here unchanged — it is derived from this, so it could not fail
 *  to. What this adds is the workings: which of his eleven put the 9 on the
 *  board, not just that it was 9.
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
