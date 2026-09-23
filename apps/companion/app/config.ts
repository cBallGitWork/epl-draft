import { MAX_PAPER_STORIES, type GroundPhoto } from "@epl/core";

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

/** A team to treat as the reader's own when nobody has signed in, for the test leagues, from the
 *  environment. Lent only when it is one of the served league's teams (`lentTeam`). */
export const DEMO_TEAM_ID = process.env.FANTRAX_DEMO_TEAM_ID || null;

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

/** How stale a rendered page may be, in seconds. Next reads `revalidate` statically, so every
 *  route segment repeats it as a literal; `scripts/revalidate.test.ts` holds them together. */
export const PAGE_REVALIDATE = 30;

/** How stale a printed article may be, in seconds. A story ships with the deploy that files it,
 *  so the inside pages need not re-render compiled-in prose every thirty. The front page keeps
 *  `PAGE_REVALIDATE` for its live scoreboard. */
export const ARTICLE_REVALIDATE = 300;

/** How stale Opta's commentary may be, in seconds: the round's one expensive read (one request
 *  per fixture), and nothing a reader watches for comes from it. Counted 21 Sep 2026. */
export const COMMENTARY_REVALIDATE = 300;

/** Lifetime of the two reads a live score is drawn from, in seconds. Below `POLL.live` plus a
 *  fetch, or a stale-while-revalidate entry makes a lone reader see new scores every other poll. */
export const LIVE_REVALIDATE = 20;

/** How often an open page asks for a fresh render, in seconds. */
export const POLL = {
  live: 30,
  idle: 300,
} as const;

/** How long the season's Fantrax code stays good, in seconds: it changes once a year. */
export const SEASON_CODE_LIFE = 60 * 60 * 6;

/** The photograph behind every desk screen, or null for the round's own portraits.
 *  `components/football/PhotoGround` carries the scrim arithmetic. */
export const DESK_GROUND: string | null = "/ground/crowd.jpg";

/** Its credit, printed on `/credits`: CC BY-SA 4.0 requires the author, the source and the terms.
 *  Replace it with the photograph. */
export const DESK_GROUND_CREDIT: Pick<
  GroundPhoto,
  "title" | "author" | "licence" | "licenceUrl" | "source"
> | null = {
  title: "Crowd at Anfield before the match 1",
  author: "Rodhullandemu",
  licence: "CC BY-SA 4.0",
  licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
  source: "https://commons.wikimedia.org/wiki/File:Crowd_at_Anfield_before_the_match_1.jpg",
};

/** The same picture at 16px wide, inline, so it paints before any request returns. Null
 *  whenever `DESK_GROUND` is. */
export const DESK_GROUND_BLUR: string | null =
  "data:image/jpeg;base64,/9j/2wBDABIMDRANCxIQDhAUExIVGywdGxgYGzYnKSAsQDlEQz85Pj1HUGZXR0thTT0+WXlaYWltcnNyRVV9hnxvhWZwcm7/2wBDARMUFBsXGzQdHTRuST5Jbm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm7/wAARCAALABADASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAAAgME/8QAIBAAAgICAQUBAAAAAAAAAAAAAQMCEQAEIRITM0GR4f/EABQBAQAAAAAAAAAAAAAAAAAAAAP/xAAaEQACAgMAAAAAAAAAAAAAAAAAAQIRISIx/9oADAMBAAIRAxEAPwAnag2LJLPux1fmWTsJcycmtgLPAMvuHY1EdvxQFkA0KzInURFTiFxuMuL5rCi6yhp7dP/Z";
