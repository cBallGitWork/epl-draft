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

/** Each section owns a set of routes, not just the one it links to: a manager
 *  reading a squad or a past gameweek is still in that section, and navigation
 *  that goes blank as soon as you tap into a detail page has stopped saying
 *  where you are. */
export const SECTIONS = [
  { href: "/", label: "Gazetta", routes: ["/"] },
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
