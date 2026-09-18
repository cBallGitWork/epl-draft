import { FANTRAX_LEAGUE_ID, FANTRAX_LEAGUES, MAX_PAPER_STORIES } from "@epl/core";

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

/** The paper's own name.
 *
 *  Not the league's name, which is the publisher and prints above the title in
 *  the small capitals a masthead puts a publisher in. The two are different
 *  things and the front page had been setting one where the other belongs:
 *  a screen announces which app you are in, a masthead names the publication.
 *  Here rather than in core, because core serves any consumer of this league and
 *  only this companion prints a paper.
 *
 *  There is no standing line beside it. "Ten managers, one league, every week"
 *  stood in the crest plate until 2 Sep 2026 and was cut: a masthead carries
 *  facts — a publisher, a date, an edition, a price — and a strapline counting
 *  the readership is a product's tagline, which is what made the plate read as
 *  a landing page. It had also been wrong for a month, which is the other thing
 *  a slogan does. */
export const PAPER_NAME = "The Gazetta";

/** How much of the paper prints on the front page.
 *
 *  A front page is a front page: the rest is a page of its own when there is
 *  enough to warrant one. Both sections say their true total in the heading, so
 *  a reader can see they are looking at a selection. */
export const DEALS_SHOWN = 6;
export const DOUBTS_SHOWN = 8;


/** How many filed stories run beside the lead, at the second rank.
 *
 *  Two, because that is the shape every front page converges on — a splash, two
 *  shoulders under it, and the rest in briefs. It is what a broadsheet does with
 *  a fold and what a news site does on a phone, which is the same problem twice:
 *  a reader must be able to rank the top three stories before reading a word.
 *
 *  Under this the page printed eight identical teasers in one column, so the
 *  second story and the eighth were set the same size and the sheet had one
 *  rank on it instead of three. */
export const SHOULDER_STORIES = 2;

/** How many filed stories run as headlines under the written lead, shoulders
 *  included.
 *
 *  **A front page prints headlines and no articles at all.** It printed every
 *  filed story in full until 2 Sep, which is a magazine; then just the lead in
 *  full until 3 Sep, which put the second story on the sheet some nineteen
 *  hundred pixels down a phone and made the ranks under it furniture nobody
 *  reached. The articles are on the pages behind — a headline turns to one.
 *
 *  Eight, against a paper that holds up to `MAX_PAPER_STORIES`: a busy round
 *  fills the sheet without the front page becoming an index of itself.
 *
 *  **Every story, while the paper is being verified** (Craig, 18 Sep 2026:
 *  *"show all articles we create so we can verify"*). Eight of sixteen meant
 *  four filed stories were off the sheet and, until `paperPages` claimed their
 *  kinds, off every page — so a story could be written, committed, and seen by
 *  nobody. Set back to 8 once each kind has been read once; the constant is the
 *  only thing to change and this paragraph is the reminder. */
export const HEADLINES_SHOWN = MAX_PAPER_STORIES;

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
