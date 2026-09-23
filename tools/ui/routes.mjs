// The routes the instruments walk, in one place.
//
// **Written out three times until 11 Sep 2026** — `sweep` and `tapfit` carried
// byte-identical seventeen-entry lists, `groundfit` the desk subset, and the two
// explanatory comments (Scout's query-string view, the inbox) appeared verbatim
// in all three. Adding `/credits` would have been a fourth spelling of a route
// that already had nowhere to live, which is what made the count worth acting
// on: three is the bar, and this was three.
//
// It is the same argument `components/shell/sections.ts` makes for the app's own
// nav — one table, because more than one register reads it — and the reason it
// belongs here rather than there is that `sections.ts` lists SECTIONS, which is
// a product idea, and this lists everything an instrument should measure,
// which is not the same set. `/credits` is on this list and is deliberately not
// a section.
//
// Their own rule, kept: *a route this list does not name is a route that ships
// unmeasured.*

import { existsSync, readdirSync } from "node:fs";

/** Everything the desk draws, and therefore everything that has a photographic
 *  ground behind it. */
export const DESK_ROUTES = [
  "/league",
  "/league/schedule",
  "/league/results",
  "/league/team-stats",
  "/league/matchups",
  "/squad",
  "/players",
  // Scout's second view. Its two ids are in the QUERY rather than the path, so
  // `discover` cannot reach it by following a link off the board — the board
  // only links here once a first man has been chosen. Two real ids, like every
  // other fixed entry in this list.
  "/players/analysis?a=05gcr&b=03ksl",
  "/matchday",
  "/matchday/desk",
  "/fpl",
  // The manager's inbox, added with the section on 5 Sep 2026. A route this
  // list does not name is a route that ships unmeasured.
  "/news",
  // Who took the photographs behind the desk, added with the grounds on 11 Sep
  // 2026. Not a section and reachable only from the rail's foot and the phone's
  // drawer, which is exactly the kind of route that goes unmeasured by accident.
  "/credits",
];

/** The competition's own front page. On `sweep` and `tapfit` since they were
 *  written and NOT on `groundfit`, which is a gap rather than a decision — it
 *  is a desk route with a ground like any other. Kept out here so the extraction
 *  preserves behaviour exactly; widening the gate is its own change, with its
 *  own run. */
export const PREM_ROUTE = "/prem";

/** Newsprint. No photograph behind it — `isPaperRoute` stands the ground down —
 *  so `groundfit` has nothing to measure here, and the other two still do. */
export const PAPER_ROUTES = ["/", "/paper/reports", "/paper/columns"];

/** Every route worth measuring for contrast, overflow and tap targets.
 *
 *  Composed rather than written out again, and in whatever order the pieces fall
 *  — the instruments loop over this and report per route, so the order is
 *  cosmetic. An earlier draft rebuilt the original ordering with two `slice`
 *  calls, which is a way of making an insertion into `DESK_ROUTES` silently move
 *  `/prem` for no reader-visible gain. */
export const ALL_ROUTES = [...PAPER_ROUTES, ...DESK_ROUTES, PREM_ROUTE];

/** A match's tabs, read off the app's own `prem/match/[id]/` folders so the list cannot drift:
 *  a hand-kept one measured a deleted Report tab as `ok` (a 404) and never saw Highlights. */
const MATCH_DIR = new URL("../../apps/companion/app/prem/match/[id]/", import.meta.url);
export const MATCH_TABS = readdirSync(MATCH_DIR, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && existsSync(new URL(`${entry.name}/page.tsx`, MATCH_DIR)))
  .map((entry) => entry.name)
  .sort();

/** The views a tab switches with a query, which no folder shows: each club's board, the Fantasy Report, the pitch. */
const MATCH_VIEWS = ["stats?view=home", "stats?view=fantasy", "players?view=pitch"];

/** One match's overview, every tab under it, and the views its foot rows switch to. */
export function matchRoutes(match) {
  return [match, ...[...MATCH_TABS, ...MATCH_VIEWS].map((tab) => `${match}/${tab}`)];
}
