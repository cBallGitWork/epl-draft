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
