// Every cross-cutting constant, in one place — CODE_RULES §3 forbids league ids,
// season dates, endpoint bases and cache TTLs living inline in a mapper or a
// component.
//
// Deliberately plain constants with no imports and no `process.env`. Core stays
// framework-agnostic and environment-free; anything genuinely secret (the Fantrax
// session cookie, when the write surface lands) is read from the environment at
// the edges — a route handler or a script — and never from here. Nothing below is
// secret: the fxea reads are unauthenticated and the league id appears in the
// public league URL.

/** The competition, as our members know it. */
export const LEAGUE_NAME = "Tim Hortons Pro League";

/** Premier League season this build targets, in FPL's own notation. */
export const SEASON = "2026/27";

/** Our draft. Before it there are no rosters to read and no transitions to
 *  capture, which is what the snapshot cadence keys off. */
export const DRAFT_DATE = "2026-10-10";

export const FPL_API_BASE = "https://fantasy.premierleague.com/api";

/** Fantrax's public read surface. Unauthenticated, and — unlike FPL — it answers
 *  HTTP 200 even when it is refusing you (see league/fantrax/errors.ts). */
export const FANTRAX_FXEA_BASE = "https://www.fantrax.com/fxea/general";

/** Fantrax's sport code for the Premier League. `SOCCER` is a different sport to
 *  them and returns the wrong player pool. */
export const FANTRAX_SPORT = "EPL";

/** Our league. Public — it is the id in the league URL, not a credential. */
export const FANTRAX_LEAGUE_ID = "ayyoh3n2mr326v2o";

/** How stale a rendered page may be, in seconds.
 *
 *  Every route segment must repeat this as a literal, because Next analyses
 *  `revalidate` statically and will not read an import. The comment at each site
 *  points back here. */
export const PAGE_REVALIDATE = 30;

/** How often an open page asks the server for a fresh render, in seconds.
 *
 *  `live` matches the page's own lifetime deliberately — polling faster than the
 *  page can change is work that returns the same bytes. Between matches nothing
 *  moves quickly enough to justify the wake-ups. */
export const POLL = {
  live: PAGE_REVALIDATE,
  idle: 300,
} as const;
