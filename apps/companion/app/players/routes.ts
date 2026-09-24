// The players section's routes, named once and in one place.
//
// **Not in `query.ts`, where `POOL` and `ANALYSIS` lived.** That file narrows
// the board's query string and pulls `columns.ts`, `figure.ts` and `groups.ts`
// in behind it, so a `"use client"` board reaching for a route off it ships the
// whole column table to the browser to spell nine characters. A module with no
// imports in it, on the rule `prem/routes.ts` keeps: a route spelled in eight
// files is a route that can be renamed in seven of them.

/** The board, and the stem a player's own page hangs off — `${POOL}/{fantraxId}`. */
export const POOL = "/players";

/** One player's own page, the stem his tabs hang off. */
export function playerHref(fantraxId: string): string {
  return `${POOL}/${fantraxId}`;
}

/** Two players side by side. The `?a=&b=` builder around it is deliberately not
 *  extracted: two sites, and one completes a pair being chosen while the other
 *  reverses a finished one. §1 leaves two alone. */
export const ANALYSIS = "/players/analysis";

/** Data's club board: every real club as a fantasy manager reads it. */
export const TEAMS = "/players/teams";

/** The fixture planner: every club's next six opponents, ranked by our strength model. */
export const PLANNER = "/players/planner";
