// The players section's routes, named once and in one place.
//
// **Not in `query.ts`, where `POOL` and `ANALYSIS` lived.** That file narrows
// the board's query string and pulls `columns.ts`, `figure.ts` and `groups.ts`
// in behind it, so a `"use client"` board reaching for a route off it ships the
// whole column table to the browser to spell nine characters. A module with no
// imports in it, on the rule `prem/routes.ts` keeps: a route spelled in eight
// files is a route that can be renamed in seven of them.

/** One value of a query parameter Next may hand as an array: the last wins, as a browser's does. */
export function lastValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[value.length - 1] : value;
}

/** The board, and the stem a player's own page hangs off — `${POOL}/{fantraxId}`. */
export const POOL = "/players";

/** One player's own page, the stem his tabs hang off. */
export function playerHref(fantraxId: string): string {
  return `${POOL}/${fantraxId}`;
}

/** The value of Data's season picker that shows every season with its club. */
export const ALL_SEASONS = "all";

/** One player's record, at a season the picker offers: `""` is this season, `ALL_SEASONS` every one. */
export function playerDataHref(fantraxId: string, season = ""): string {
  return season === "" ? `${playerHref(fantraxId)}/data` : `${playerHref(fantraxId)}/data?season=${season}`;
}

/** One player's news, with one story open when `story` names it. */
export function playerNewsHref(fantraxId: string, story?: string): string {
  const list = `${playerHref(fantraxId)}/news`;
  return story === undefined ? list : `${list}?story=${encodeURIComponent(story)}`;
}

/** Two players side by side. The `?a=&b=` builder around it is deliberately not
 *  extracted: two sites, and one completes a pair being chosen while the other
 *  reverses a finished one. §1 leaves two alone. */
export const ANALYSIS = "/players/analysis";

/** Data's club board: every real club as a fantasy manager reads it. */
export const TEAMS = "/players/teams";

/** The sister model's projected points for the next six gameweeks. */
export const PROJECTIONS = "/players/projections";

/** Off while the projections are bad data (Craig, 7 Oct 2026): no tab, and the page 404s. */
export const PROJECTIONS_SHOWN = false;

/** The fixture planner: every club's next six opponents, ranked by our strength model. */
export const PLANNER = "/players/planner";
