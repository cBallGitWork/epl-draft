import type { StatColumn, StatLine, TeamStats } from "./stats";

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
// Here rather than in either of its readers because there are three of them
// now: the player profile's season table, the live card on the head-to-head
// board, and the squad-wide read the board makes once per side. All three were
// pairing the same two arrays and splitting the same string.

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

function split(column: StatColumn): { name: string; definition: string | null } {
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
      return [{ code: column.code, ...split(column), points }];
    })
    .sort((a, b) => b.points - a.points);
}

/** Every player in one team's table, by Fantrax id.
 *
 *  Keeper and outfielder are separate groups with different columns, and they
 *  stay separate right up to this map: pairing each line with its own group's
 *  header is what keeps a keeper's saves out from under an outfielder's goals
 *  against. */
export function pointsBreakdown(stats: TeamStats): Map<string, BreakdownLine[]> {
  const breakdown = new Map<string, BreakdownLine[]>();
  for (const group of stats.groups) {
    for (const line of group.lines) breakdown.set(line.fantraxId, breakdownOf(group.columns, line));
  }
  return breakdown;
}
