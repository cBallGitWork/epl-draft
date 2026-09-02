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

/** The paper's territory: the front page, and the pages behind it.
 *
 *  **This reverses the 31 Aug reversal, on Craig's word (2 Sep).** Inside pages
 *  were built here on 31 Aug and reverted the same day, and the argument then
 *  was sound: a second paper route grew a folio and a contents strip, which
 *  meant printing the desk's own six section names in newsprint, twice over,
 *  under a page whose top line read "Matches" where a masthead belongs.
 *
 *  What changed is that the paper now has something to put on them. On 31 Aug
 *  nothing had ever been filed, so an inside page was furniture with no
 *  articles behind it; a folio numbering empty sections is numbering the app.
 *  The paper files real columns now, a front page cannot hold them all, and a
 *  headline that opens in place is a headline that can never be linked to.
 *
 *  The revert's two complaints are answered rather than ignored. The desk's
 *  six names print once, in `Index`, exactly as before — the paper's own strip
 *  (`Pages`) lists the paper's pages and nothing else, in different dress. And
 *  an inside page opens on `Folio`, which leads with THE GAZETTA and puts the
 *  section and its number beneath, so a masthead is never displaced by a word
 *  like "Matches".
 *
 *  Still true, and still the rule: extra MATERIAL — the draft table, the
 *  Premier League table, the charts — belongs in sections on the front page.
 *  What lives behind a page is an ARTICLE. */
const PAPER_ROUTES = ["/", "/paper"];

/** Each section owns a set of routes, not just the one it links to: a manager
 *  reading a squad or a past gameweek is still in that section, and navigation
 *  that goes blank as soon as you tap into a detail page has stopped saying
 *  where you are. */
/** **Squads is not a section** (Craig, 2 Sep: "I think we can remove the squads
 *  icon in nav bar, it's redundant with accessing the squads via the league
 *  anyways"). He is right about the redundancy and the reference agrees about
 *  the principle: Championship Manager's rail is "where you can go from
 *  anywhere" — Competitions, Nations & Clubs, Find — and a CLUB is never on it,
 *  because you reach a club through the competition it plays in. A squad is our
 *  club screen and every route into it is a team name somebody tapped: the
 *  league table, the schedule, results, team stats, the matchup board, a
 *  player's profile. Eight of them, counted.
 *
 *  `/squad` itself still exists and still works — the index is a real page and
 *  the sign-in lives on it. It is simply not a destination the rail offers,
 *  which is the difference between a route and a section. */
export const SECTIONS = [
  { href: "/", label: "Gazetta", routes: PAPER_ROUTES },
  { href: "/league", label: "League", routes: ["/league"] },
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
