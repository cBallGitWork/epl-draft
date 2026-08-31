// How the app is actually divided, as data.
//
// One table, because two registers print it: the desk's rail and the paper's
// index. A list of section names copied into both would drift, and this is the
// exact drift `navfit.mjs` already reads its labels out of the DOM to avoid —
// its predecessor carried its own copy of the six and went stale the day
// "Matchday" was renamed "Live".
//
// No JSX and no `"use client"`: the rail is a client component and the paper's
// index is a server one, and a plain table crosses that line without either of
// them having to care.

/** The paper's territory: the front page, and the inside pages under `/paper`.
 *  One list, because two things key off it — the Gazetta section marks itself
 *  on any of them, and the desk's rail stands down on all of them. */
const PAPER_ROUTES = ["/", "/paper"];

/** Each section owns a set of routes, not just the one it links to: a manager
 *  reading a squad or a past gameweek is still in that section, and navigation
 *  that goes blank as soon as you tap into a detail page has stopped saying
 *  where you are. */
export const SECTIONS = [
  { href: "/", label: "Gazetta", routes: PAPER_ROUTES },
  { href: "/league", label: "League", routes: ["/league"] },
  { href: "/squad", label: "Squads", routes: ["/squad"] },
  // "Live" rather than "Matchday": the section only exists while football is on,
  // so that is what it means.
  { href: "/matchday", label: "Live", routes: ["/matchday", "/gw"], onlyDuringGameweek: true },
  { href: "/players", label: "Players", routes: ["/players"] },
  { href: "/fpl", label: "FPL", routes: ["/fpl"] },
];

export function owns(routes: readonly string[], pathname: string): boolean {
  return routes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

/** Whether a route is newsprint rather than desk. The rail asks it to stand
 *  down; anything else that needs to know which register it is under asks here
 *  rather than keeping its own list of paper routes. */
export function isPaperRoute(pathname: string): boolean {
  return owns(PAPER_ROUTES, pathname);
}
