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
