import { FANTRAX_LEAGUE_ID, FANTRAX_LEAGUES } from "@epl/core";

// The app's own constants — the ones that are decisions about this companion
// rather than about the league or the football.
//
// Separate from `packages/core/src/config.ts` on purpose: core must not know
// what a cookie is or how many rows a section prints. Anything a second consumer
// of core would also need belongs there instead.

/** The signed session naming which team is holding the phone. */
export const TEAM_COOKIE = "team";

/** The manager's FPL entry id. Unsigned, unlike the team session: an entry id is
 *  public, and claiming somebody else's shows you their team on your own phone
 *  and nothing more. */
export const ENTRY_COOKIE = "fpl";

/** How long both cookies last, in seconds.
 *
 *  One season is the useful lifetime, and the 10 Oct swap invalidates the team
 *  one by itself — a rehearsal team id stops matching any team in the league we
 *  serve, and `myTeamId` drops it. */
export const SEASON_IN_SECONDS = 60 * 60 * 24 * 300;

/** What a wrong sign-in code costs, in milliseconds. There is no rate limiter to
 *  put in front of a serverless route, so the defences are a long code and a
 *  slow no. */
export const WRONG_CODE_DELAY_MS = 700;

/** How much of the paper prints on the front page.
 *
 *  A front page is a front page: the rest is a page of its own when there is
 *  enough to warrant one. Both sections say their true total in the heading, so
 *  a reader can see they are looking at a selection. */
export const DEALS_SHOWN = 6;
export const DOUBTS_SHOWN = 8;

/** The league this deployment actually serves.
 *
 *  `FANTRAX_LEAGUE_ID` is the env var and the whole of the 10 Oct swap; this is
 *  the rest of what we know about whichever league it names — chiefly the draft
 *  date three pages tell an empty league to come back for. Undefined if the id
 *  ever names a league we do not carry, which is a state worth seeing rather
 *  than defaulting past.
 */
export function servedLeague() {
  return FANTRAX_LEAGUES.find((league) => league.leagueId === FANTRAX_LEAGUE_ID);
}

/** What a page says when the league's own provider will not answer.
 *
 *  One title, five pages, and deliberately not a shared component: the sentence
 *  under it differs on every one of them — the pool would go stale in ownership
 *  first, the standings have no local copy to fall back on, the schedule is the
 *  league describing itself — and that per-page sentence is the whole reason the
 *  panel is worth having. A wrapper that only filled in this string would be a
 *  wrapper that forwards its arguments.
 */
export const FANTRAX_SILENT = "Fantrax is not answering";
