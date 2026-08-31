// Every cross-cutting constant, in one place — CODE_RULES §3 forbids league ids,
// season dates, endpoint bases and cache TTLs living inline in a mapper or a
// component.
//
// Deliberately plain constants with no imports. The one environment read is
// `FANTRAX_LEAGUE_ID` below: §5 bans environment reads in mappers, scoring and
// engines, which is where an unseen `process.env` does damage — a config module
// is the one place it is legible. Anything genuinely secret (the Fantrax session
// cookie, when the write surface lands) is read at the edges — a route handler or
// a script — and never from here. Nothing below is secret: the fxea reads are
// unauthenticated and the league id appears in the public league URL.

// Core's tsconfig deliberately omits node types so nothing in here can reach for
// `fs`. Declaring the one global we do read keeps that door shut rather than
// opening it for a single string.
declare const process: { env: Record<string, string | undefined> };

/** The competition, as our members know it. */
export const LEAGUE_NAME = "Tim Hortons Pro League";

/** Premier League season this build targets, in FPL's own notation. */
export const SEASON = "2026/27";

export const FPL_API_BASE = "https://fantasy.premierleague.com/api";

/** How a provider sees us.
 *
 *  A real browser string rather than a bot's. Both providers front their APIs
 *  with a WAF that treats unfamiliar agents as worth challenging, and neither
 *  publishes what it wants to see; the sibling project's season-long sweep
 *  survived on exactly this. Not a disguise — every read here is public data
 *  their own website serves to anyone. */
export const HTTP_USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";

/** Attempts after the first, when a provider says it is busy. Two is the point
 *  where a blip is covered and a real outage is not being argued with. */
export const HTTP_RETRIES = 2;

/** First backoff step in milliseconds; doubles per attempt, plus jitter. */
export const HTTP_BACKOFF_BASE_MS = 500;

/** Fantrax's public read surface. Unauthenticated, and — unlike FPL — it answers
 *  HTTP 200 even when it is refusing you (see league/fantrax/errors.ts). */
export const FANTRAX_FXEA_BASE = "https://www.fantrax.com/fxea/general";

/** Fantrax's own SPA API, the surface their website talks to.
 *
 *  A different protocol from fxea, not a different path on it: one POST carrying
 *  a batch of `msgs`, and failures reported in a different envelope again (see
 *  league/fantrax/errors.ts). Several useful reads are public here — the
 *  transaction history among them — so this is not the authenticated surface.
 *  Anything needing a session cookie takes it as an argument. */
export const FANTRAX_FXPA_BASE = "https://www.fantrax.com/fxpa/req";

/** Fantrax's website, for handing a manager back to it.
 *
 *  We plan lineups and do not submit them, so every plan ends in an outbound
 *  link. Only the league path is used, which is the one shape confirmed from a
 *  real browser session — a deeper guess at their roster URL would break
 *  silently the day they reorganise their routes. */
export const FANTRAX_APP_BASE = "https://www.fantrax.com/fantasy/league";

/** Fantrax's sport code for the Premier League. `SOCCER` is a different sport to
 *  them and returns the wrong player pool. */
export const FANTRAX_SPORT = "EPL";

/** Minutes on the pitch before a clean sheet is worth previewing.
 *
 *  FPL's threshold, used deliberately for a Fantrax preview. Fantrax credits
 *  clean sheets only at full time and publishes no threshold of its own — it
 *  says "on field" and no more — so this is the moment a manager watching the
 *  match already expects the points to appear, because it is when FPL's own
 *  numbers move. Fantrax settles it their way at the whistle and their answer
 *  replaces ours (see join/cleanSheets.ts). */
export const CLEAN_SHEET_MINUTES = 60;

/** A Fantrax league we capture.
 *
 *  `key` doubles as a directory segment under `data/snapshots/fantrax/leagues/`,
 *  so renaming one is a data move, not a rename. `draftDate` is per league, not
 *  global: the two draft nine weeks apart and the capture cadence tightens on
 *  each one's own draft day. */
export interface FantraxLeague {
  key: string;
  leagueId: string;
  draftDate: string;
}

/** Both leagues are public — these are the ids in their league URLs, not
 *  credentials. `rehearsal` is the 4-team league drafted on 6 Aug; everything is
 *  built against it so that on 10 Oct the only change is which id the app
 *  serves. */
export const FANTRAX_LEAGUES: readonly FantraxLeague[] = [
  { key: "real", leagueId: "ayyoh3n2mr326v2o", draftDate: "2026-10-10" },
  { key: "rehearsal", leagueId: "zbn1z3ukmsgb36sz", draftDate: "2026-08-06" },
];

/** The league the app serves, and the league the columnist writes about.
 *
 *  **Two environments, not one.** Setting this in Vercel swaps the app; the
 *  edition workflow has its own environment and inherits nothing from it, so
 *  `.github/workflows/editions.yml` sets it too. Miss the second and CI goes on
 *  filing a rehearsal column that the real league's front page would match on
 *  period and kind alone — which is what `PublishedEdition.leagueId` now stops.
 *
 *  `||` and not `??`, deliberately. An unset GitHub Actions variable expands to
 *  the empty string rather than to nothing, so `??` would accept `""` as a
 *  league id and every read would fail on a blank leagueId with no clue why.
 *  The same trap `secret()` was carrying on 27 Aug. */
export const FANTRAX_LEAGUE_ID =
  process.env.FANTRAX_LEAGUE_ID || FANTRAX_LEAGUES[1].leagueId;

/** How many players to ask Fantrax's stats read for in one page.
 *
 *  Their own site asks for twenty and paginates thirty-six times; the parameter
 *  is honoured well past that, so the whole pool arrives in one request. Set
 *  comfortably above the ~708 they carry, and the read reports the total back so
 *  a page that ever does overflow this says so rather than showing a prefix. */
export const POOL_PAGE_SIZE = 2000;

/** How far before a round's FIRST KICKOFF lineups lock, in minutes.
 *
 *  **A commissioner setting Fantrax states on its settings page and through no
 *  API we can read, written down here because it has to live somewhere (§3).**
 *  Confirmed on `createLeague.go?goto=5` on 20 Aug 2026: `lineupLockType` is
 *  `TIME_BEFORE_FIRST_GAME` — "Set amount of time before 1st game of period" —
 *  and `lineupLockTimeBeforeGame` is `00:15`.
 *
 *  Measured back from the first kickoff and **not from the period boundary**,
 *  which is what an earlier version of this comment said. The two coincide only
 *  when the gameweek has a Friday night match; see `gazette/deadline.ts`.
 *
 *  Fantrax's other option is `TIME_BEFORE_FIRST_GAME_OF_SCORER`, a per-player
 *  rolling lock. This league does not use it, which is why there is one deadline
 *  a week and it is a real thing to print.
 *
 *  **If the commissioner moves the lock, this number is the only place that
 *  knows.** Nothing will fail; the app will simply print the wrong time to
 *  sixteen people, which is the failure mode a deadline can least afford. */
export const LINEUP_LOCK_LEAD_MINUTES = 15;

/** Where the Premier League serves its crests.
 *
 *  §3 puts a provider's base URL here rather than inline beside the code that
 *  builds a path onto it. `next.config.ts` names the hostname separately and
 *  cannot read this: Next resolves image domains before any of our code runs. */
export const PL_ASSET_BASE = "https://resources.premierleague.com/premierleague";

/** Where the Premier League serves its player portraits, which is NOT where it
 *  serves its crests any more.
 *
 *  `premierleague25` is theirs, verbatim, read out of FPL's own production
 *  bundle on 19 Aug 2026. It is not a season number and must never be computed
 *  from one: we are in 26/27 and it says 25, `premierleague26` answers 502, and
 *  the assets under 25 are current — dated Aug and Sep 2025 against Aug 2024 on
 *  the old path, with photographs for players the old path had none for.
 *
 *  Two constants and not one interpolated base, because the two paths have now
 *  diverged twice: the prefix differs, and so does the filename (`p{code}.png`
 *  for a crest-era portrait, `{code}.png` here). */
export const PL_PHOTO_BASE = "https://resources.premierleague.com/premierleague25";

/** Where FPL serves club kits — its own host, not the Premier League's CDN.
 *
 *  Twenty outfield shirts and twenty keeper shirts serve the whole league at
 *  ~10 KB each, and they are selected by club code rather than by a photograph
 *  of a man, so a transfer changes the shirt the same day. That is the whole
 *  reason they are here: a portrait cannot be that current. */
export const FPL_SHIRT_BASE = "https://fantasy.premierleague.com/dist/img/shirts/standard";

/** Where Fantrax serves the badge a manager picked for his fantasy team.
 *
 *  A prefix and not just a host, because it is a gate as well as an address:
 *  `next.config.ts` allow-lists exactly this path for the image optimizer, and a
 *  badge URL from anywhere else makes `next/image` throw — which takes down a
 *  whole page rather than losing one 26px icon. `getTeamRosterInfo` carries
 *  `logoUploaded`, so a custom upload served from some other path is a state
 *  this league can reach; `mapTeamBadges` drops any URL that is not under here
 *  and the team shows its initial instead.
 *
 *  As with the Premier League's assets, `next.config.ts` names the same path
 *  separately and cannot read this: Next resolves image domains before any of
 *  our code runs. The two must be changed together. */
export const FANTRAX_BADGE_BASE =
  "https://fantraximg.com/assets/images/icons/fantasyteams";

/** The photograph behind every desk screen, or null while there is none.
 *
 *  Championship Manager drew every screen over a darkened match photograph and
 *  dropping it is most of why a retokened desk still read as a website. DESIGN
 *  §2 recorded dropping it because "it fails AA outright and no amount of scrim
 *  fixes a ground that changes under the text" — and the second half of that is
 *  wrong. A scrim at opacity a over the ground can never composite lighter than
 *  `a x brightest + (1 - a) x bg`, whatever the photograph holds; that is a
 *  BOUND, so it can be solved rather than feared. Darken the picture first and
 *  the same bound buys far more of it. `components/football/PhotoGround` carries
 *  the arithmetic and the two numbers it solves for.
 *
 *  **A path under `public/`.** Craig, 31 Aug: "the background IS the image. Just
 *  use a crowd shot from a premier league game." What is there is Anfield before
 *  kick-off, from Wikimedia Commons — `Crowd_at_Anfield_before_the_match_1.jpg`,
 *  **CC BY-SA 4.0**, which needs attributing or replacing before this is public.
 *  Craig pointed at champman0102.net's background packages, which 403 anything
 *  that is not a browser, so this is a licence-clean stand-in for one of those.
 *
 *  Set it to null and the ground falls back to the round's own portraits.
 *  The scrim and the darkening do not move with either, because their product is
 *  what keeps every screen above the floor.
 */
export const DESK_GROUND: string | null = "/ground/crowd.jpg";

/** The league's clock. Every date a manager reads is in it, whatever their phone
 *  says, because a deadline is the same instant for all sixteen of them and a
 *  capture is filed under the day it happened here.
 *
 *  Deliberately not the football calendar's timezone even though they agree
 *  today: this is our league's, and the two are separate questions. */
export const LEAGUE_TIMEZONE = "Europe/London";

/** How many saves are worth mentioning.
 *
 *  A keeper makes one or two most weeks and it says nothing; a number worth
 *  printing is one that made a difference. Named here because four views judge
 *  it — the gazette's team of the week, the match list, the player sticker and
 *  `contributions` — and until now the sticker disagreed with the other three. */
export const NOTABLE_SAVES = 4;

/** How many matches ahead a fixture run reads.
 *
 *  Five, because that is roughly the horizon anyone holding a player is deciding
 *  over — long enough that one hard week does not decide it, short enough that
 *  FPL's difficulty ratings have not been overtaken by a January transfer
 *  window. Named here rather than at the one call site because it is a judgement
 *  about the game, not a measurement of the space on screen. */
export const FIXTURE_RUN = 5;

/** How many transaction rows to ask for in one page.
 *
 *  Their own client sends 100 and the response reports `totalNumPages` back, so
 *  a league busy enough to overflow a page says so rather than quietly serving
 *  the first hundred as if they were all of it. Sixteen teams will not reach it
 *  in a season. */
export const TRANSACTION_PAGE_SIZE = 100;

/** How long the current season's Fantrax code stays good, in seconds.
 *
 *  Six hours rather than thirty, because the answer changes once a year. It is
 *  looked up rather than written down — a literal season code would need editing
 *  every August — and looking it up costs a request, so it is worth not
 *  repeating on every tap of a player's name. */
export const SEASON_CODE_LIFE = 60 * 60 * 6;

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
