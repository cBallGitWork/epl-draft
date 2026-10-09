// The Data section's routes, in a module with no imports so a client component can reach one without the column table.

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

/** Two players side by side, `?a=&b=`. */
export const ANALYSIS = `${POOL}/analysis`;

/** Compare, carrying each field given a value in the order given: the men, the boxes' searches, the view and range. */
export function compareHref(fields: Partial<Record<"a" | "b" | "qa" | "qb" | "view" | "range", string>>): string {
  const query = new URLSearchParams();
  for (const [name, value] of Object.entries(fields)) if (value !== undefined && value !== "") query.set(name, value);
  const search = query.toString();
  return search === "" ? ANALYSIS : `${ANALYSIS}?${search}`;
}

/** Data's club board: every real club as a fantasy manager reads it. */
export const TEAMS = `${POOL}/teams`;

/** The sister model's projected points for the next six gameweeks. */
export const PROJECTIONS = `${POOL}/projections`;

/** Off while the projections are bad data (Craig, 7 Oct 2026): no tab, and the page 404s. */
export const PROJECTIONS_SHOWN = false;

/** The fixture planner: every club's next six opponents, ranked by our strength model. */
export const PLANNER = `${POOL}/planner`;
