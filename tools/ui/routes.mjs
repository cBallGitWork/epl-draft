// The routes the instruments walk, in one place: a route this list does not name ships unmeasured.

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { discover } from "./cdp.mjs";

/** Data's projections board, walked only while the app shows it: switched off it is a true 404 (`PROJECTIONS_SHOWN`). */
const PROJECTIONS_SHOWN = (() => {
  const routes = readFileSync(new URL("../../apps/companion/app/players/routes.ts", import.meta.url), "utf8");
  const flag = /export const PROJECTIONS_SHOWN = (true|false);/.exec(routes);
  if (flag === null) throw new Error("tools/ui/routes.mjs: cannot read PROJECTIONS_SHOWN from players/routes.ts");
  return flag[1] === "true";
})();

/** Each declared cup but the first, which the bare `/league/cups` draws, by the ids core's `CUPS` declares. */
const CUP_ROUTES = (() => {
  const declared = readFileSync(new URL("../../packages/core/src/league/cups/declared.ts", import.meta.url), "utf8");
  const ids = [...declared.matchAll(/^ {4}id: "([^"]+)",$/gm)].map((match) => match[1]);
  if (ids.length === 0) throw new Error("tools/ui/routes.mjs: cannot read the cups' ids from cups/declared.ts");
  return ids.slice(1).map((id) => `/league/cups?cup=${id}`);
})();

/** Everything the desk draws, and so everything with the photographic ground behind it. */
export const DESK_ROUTES = [
  "/league",
  "/league/schedule",
  "/league/results",
  "/league/team-stats",
  "/league/cups",
  "/league/scoring",
  ...CUP_ROUTES,
  "/league/matchups",
  "/squad",
  "/players",
  // The fixture planner's phone view is a query, so the defence board is named too.
  "/players/teams",
  "/players/planner",
  "/players/planner?view=defence",
  ...(PROJECTIONS_SHOWN ? ["/players/projections"] : []),
  "/matchday",
  // The Live tab's other two views are queries, so nothing links a crawler to them.
  "/matchday?view=vidiprinter",
  "/matchday?view=stats",
  "/matchday/desk",
  "/fpl",
  "/news",
  // Not a section: reachable only from the rail's foot and the phone's drawer.
  "/credits",
];

/** The competition's front page: on `sweep` and `tapfit`, not yet on `groundfit`. */
const PREM_ROUTE = "/prem";

/** The front page as an instrument opens it: a signed-in cold open of a bare `/` lands on Mail or Live. */
export const FRONT_PAGE = "/?paper";

/** Newsprint, with no photograph under it, so `groundfit` has nothing to measure here. */
const PAPER_ROUTES = [FRONT_PAGE];

/** Every route worth measuring for contrast, overflow and tap targets. */
export const ALL_ROUTES = [...PAPER_ROUTES, ...DESK_ROUTES, PREM_ROUTE];

/** A match's tabs, read off the app's own `prem/match/[id]/` folders so the list cannot drift. */
const MATCH_DIR = new URL("../../apps/companion/app/prem/match/[id]/", import.meta.url);
const MATCH_TABS = readdirSync(MATCH_DIR, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && existsSync(new URL(`${entry.name}/page.tsx`, MATCH_DIR)))
  .map((entry) => entry.name)
  .sort();

/** The views a tab switches with a query, which no folder shows: each club's board, the Fantasy Report, the pitch. */
const MATCH_VIEWS = ["stats?view=home", "stats?view=fantasy", "players?view=pitch"];

/** One match's overview, every tab under it, and the views its foot rows switch to. */
function matchRoutes(match) {
  return [match, ...[...MATCH_TABS, ...MATCH_VIEWS].map((tab) => `${match}/${tab}`)];
}

/** A played match's screens, discovered off the results list: a fixture id is per-season, so none is written down. */
export async function playedMatchRoutes(cdp) {
  const match = await discover(cdp, "/prem/results", 'a[href^="/prem/match/"]');
  return match ? matchRoutes(match) : [];
}

/** One player's screens, discovered off the directory's BODY: a bare selector finds Find's own tab strip first. Then
 *  Compare, off the link the board gives the next man once he is chosen (`?compare=`), as no link reaches it bare. */
export async function playerRoutes(cdp) {
  const man = await discover(cdp, "/players", 'tbody a[href^="/players/"]');
  if (!man) return [];
  const pair = await discover(cdp, `/players?compare=${man.split("/").pop()}`, 'tbody a[href^="/players/analysis?"]');
  return [man, ...["data", "news", "transfer", "data?season=all"].map((tab) => `${man}/${tab}`), ...(pair ? [pair] : [])];
}
