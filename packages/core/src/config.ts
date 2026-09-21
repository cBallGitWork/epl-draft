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

/** The paper's football correspondent, whose name goes on every story.
 *
 *  **One, and it is a constant rather than a field on a story** (Craig, 17 Sep
 *  2026: *"start with 1, establish then expand"*). A paper with one reporter is
 *  a fact about the PAPER; it becomes a fact about a STORY on the day there are
 *  two of them, and that is the point to add `reporter` to `PublishedStory` and
 *  let the writer choose. Until then a field would be the same string written
 *  into committed JSON once per filing, and renaming him would be a migration
 *  rather than an edit.
 *
 *  **Invented, and deliberately not a real broadcaster.** The register is the
 *  Football Italia paper review and `voice/house.ts` says so in as many words,
 *  but a byline over machine-written copy has to be a name that belongs to
 *  nobody — even in a league of ten friends. It is also the better joke: an
 *  invented correspondent can become the league's own character, and a borrowed
 *  name can only ever be a borrowed name.
 *
 *  **In core rather than the app's config because it has two readers on
 *  opposite sides of the boundary**: the app prints it under a headline and the
 *  writer is TOLD it, so the voice knows whose byline it is writing under. The
 *  same string in two files is the drift CODE_RULES §3 is about.
 *
 *  COPY, and Craig's to change: nothing derives from it. */
export const PAPER_CORRESPONDENT = "Franco Bell";

/** The competition the football layer describes, as it is headed on the desk.
 *
 *  Ours to state rather than FPL's to publish: the bootstrap names 20 clubs and
 *  38 events and nowhere says what the thing they are playing in is called.
 *  Deliberately the period name Championship Manager 99/00 heads its own table
 *  screen with — this section is a reproduction of `cm9900/24.jpg`, and a
 *  reproduction that says "Premier League" is a modern app in CM's clothes. */
export const COMPETITION_NAME = "FA Barclays Premiership";

/** Where the season's cuts fall, counted from each end of the table.
 *
 *  A rule of the competition and not of ours, which is the whole test the layer
 *  split applies — the football layer may hold a constant precisely because
 *  nobody in our league can change this one, exactly as `table.ts` holds three
 *  for a win. FPL publishes neither number.
 *
 *  `relegate` counts UP from the bottom rather than naming a place, so a
 *  division of any size draws its line where the division actually ends. */
export const PREMIERSHIP_CUTS = { qualify: 4, relegate: 3 };

/** Premier League season this build targets, in FPL's own notation. */
export const SEASON = "2026/27";

export const FPL_API_BASE = "https://fantasy.premierleague.com/api";

/** The Premier League's own football API, which is what `premierleague.com`
 *  itself is a shell over. Public and unauthenticated: probed 4 Sep 2026 with
 *  every header removed in turn, and a bare request answers 200.
 *
 *  It is the FOOTBALL layer's second provider, not a third layer. FPL publishes
 *  what a player scored; this publishes what happened — a minute-stamped event
 *  feed, a real match clock, half-time, lineups, formations, shirt numbers,
 *  the referee and the attendance. Both describe the same Premier League, and
 *  they join on ids neither of them chose: FPL's `fixture.code` is this API's
 *  `altIds.opta` less its `g`, and FPL's `opta_code` is a player's `altIds.opta`
 *  exactly.
 *
 *  **Server-side only.** It answers
 *  `access-control-allow-origin: https://www.premierleague.com`, so a browser
 *  may not read it; nothing here may move into a `"use client"` component.
 *  Its own `cache-control` is `max-age=30`, which is `PAGE_REVALIDATE` — asking
 *  faster than that returns the same bytes from their CDN. */
export const PL_FOOTBALL_API_BASE = "https://footballapi.pulselive.com/football";

/** The Premier League's id for the season in `SEASON`.
 *
 *  Their own, opaque, and published only through
 *  `/football/competitions/1/compseasons` — 841 for 2026/27, read there on
 *  4 Sep 2026. It changes every summer and there is no way to compute it, which
 *  is why it is a constant beside `SEASON` rather than anything derived. */
export const PL_COMP_SEASON = 841;

/** Premier League competition id. 1 is the Premier League itself; the same API
 *  serves the EFL and the women's game under other numbers. */
export const PL_COMPETITION = 1;

/** How many commentary lines to ask for at once.
 *
 *  A whole match is 107 on the busiest of the thirty in gameweeks 1-3, so this
 *  is a ceiling with room rather than a page size anybody has to turn. Asking
 *  for one page and getting all of it is what keeps the client free of paging
 *  logic for a resource that is never long enough to need it. */
export const PL_TEXTSTREAM_PAGE = 300;

/** The rights holder's own highlights playlist, and the public feed that lists
 *  it.
 *
 *  Sky Sports Premier League hold the UK rights and publish official highlights
 *  on YouTube — channel `UCTU_wC79Dgi9rh4e9-baTqA`, playlist
 *  `PLUY_YSABhemI` ("Premier League Highlights 26/27"). Craig supplied both on
 *  11 Sep 2026 and `docs/providers/premier-league-api.md` carries the counts.
 *
 *  **`videos.xml` and not the Data API**, which is what makes this free of a
 *  key: the feed is public, needs no credential, and carries the latest 15
 *  entries — about a round and a half, which is what a match screen for a
 *  recent fixture asks for. A season's back catalogue would need
 *  `playlistItems.list` and a key; nothing wants one yet.
 *
 *  **The playlist id changes every summer**, the way `PL_COMP_SEASON` does, and
 *  for the same reason it sits here rather than anywhere it could be computed. */
export const HIGHLIGHTS_PLAYLIST = "PLUY_YSABhemI";
export const YOUTUBE_FEED_BASE = "https://www.youtube.com/feeds/videos.xml";

/** Where an embedded highlights video is played from.
 *
 *  The `-nocookie` host is YouTube's own privacy-preserving player and is the
 *  only surface we take: the video is embedded, never fetched and never
 *  re-hosted. */
export const YOUTUBE_EMBED_BASE = "https://www.youtube-nocookie.com/embed";

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

/** One player on Fantrax, which is where a claim is actually made.
 *
 *  **`scorerId` alone, and that was probed rather than guessed** (5 Sep 2026).
 *  Their rows carry a `urlName` slug beside the id — `semi-ajayi`,
 *  `bruno-miguel-borges-fernandes` — and their own anchors use both, so the
 *  obvious shape is `/player/{slug}/{id}`. The route is not that.
 *
 *  A status code cannot tell you: Fantrax is a single-page app and serves its
 *  shell with a 200 for `/player/not-a-real-person/zzzzz`, with the same
 *  `<title>` and no canonical link. So the route was read out of their own
 *  production bundle, which declares `player/:playerId` — one segment. The slug
 *  is decoration. PLATFORM_NOTES carries the probe.
 *
 *  `scorerId` IS our `fantraxId`, so this needs nothing we do not already hold. */
export const FANTRAX_PLAYER_BASE = "https://www.fantrax.com/player";

/** The league's own player list on Fantrax, which is where a claim is made.
 *
 *  Their matrix-parameter path, taken off Craig's own browser URL rather than
 *  constructed — the same session that gave up `positionOrGroup`, which is a
 *  parameter no amount of reading their payload would have found
 *  (PLATFORM_NOTES). It hangs off `FANTRAX_APP_BASE/{leagueId}`. */
export const FANTRAX_PLAYERS_PATH = "players;statusOrTeamFilter=ALL;pageNumber=1";

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

/** All three leagues are public — these are the ids in their league URLs, not
 *  credentials.
 *
 *  `rehearsal` was drafted on 6 Aug with four teams and is what most of this app
 *  was built against. `dummy` was made as its ten-team replacement (Craig, 1 Sep
 *  2026) because ten is the point: the real league is ten, and a screen judged
 *  against four is judged at the wrong height — the Team Stats board had to fake
 *  six rows to be looked at honestly. It answers the same 29-table
 *  `SEASON_STATS` shape with real figures in every category, checked on the day
 *  it was made.
 *
 *  **Both are ten now.** The rehearsal league was expanded on 2 Sep 2026 and
 *  carries the same ten team names as `dummy` — the capture history is the
 *  record: 4 teams every day from 6 Aug to 1 Sep, 10 from 2 Sep. So `dummy` is
 *  no longer a replacement for anything, and the two are near-duplicates that
 *  cost a capture each. Worth collapsing to one, but not before 10 Oct:
 *  `shape-diff` reads `rehearsal` as its reference against `real`, and a league
 *  is a directory of history under `data/snapshots/` that a rename would strand.
 *  This paragraph used to say `rehearsal` *is* the four-team league, which
 *  stopped being true the day before it was read. Corrected 3 Sep 2026.
 *
 *  `real` stays empty until draft night and is the standing test that empty
 *  states degrade honestly. On 10 Oct the only change is which id the app
 *  serves. */
export const FANTRAX_LEAGUES: readonly FantraxLeague[] = [
  { key: "real", leagueId: "ayyoh3n2mr326v2o", draftDate: "2026-10-10" },
  { key: "dummy", leagueId: "w05aib75mtj36y1g", draftDate: "2026-08-06" },
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
  process.env.FANTRAX_LEAGUE_ID || leagueId("dummy");

/** One league's id by name.
 *
 *  By KEY and not by index. The default used to be `FANTRAX_LEAGUES[1]`, and
 *  adding a league to the middle of that list silently repointed the whole app
 *  at a different league — which is exactly what happened when `dummy` was
 *  inserted on 1 Sep 2026. It happened to be the league we wanted; that it was
 *  luck rather than intent is the reason this exists.
 *
 *  Throws rather than falling back: a name that is not in the list is a typo,
 *  and a typo that quietly serves the wrong league is the failure this is
 *  written to make impossible. */
function leagueId(key: string): string {
  const league = FANTRAX_LEAGUES.find((entry) => entry.key === key);
  if (league === undefined) throw new Error(`No Fantrax league named "${key}"`);
  return league.leagueId;
}

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
 *  Twenty outfield shirts and twenty keeper shirts serve the whole league, and
 *  they are selected by club code rather than by a photograph of a man, so a
 *  transfer changes the shirt the same day. That is the whole reason they are
 *  here: a portrait cannot be that current. `shirtUrl` carries the sizes and
 *  what was counted at each. */
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

/** The same picture at 16px wide, inline, so it paints before any request
 *  returns. A club's own ground carries one of these on its row in
 *  `football/grounds.ts` and for the same reason; this is the shared one's.
 *  Null whenever `DESK_GROUND` is, because the two are one picture. */
export const DESK_GROUND_BLUR: string | null =
  "data:image/jpeg;base64,/9j/2wBDABIMDRANCxIQDhAUExIVGywdGxgYGzYnKSAsQDlEQz85Pj1HUGZXR0thTT0+WXlaYWltcnNyRVV9hnxvhWZwcm7/2wBDARMUFBsXGzQdHTRuST5Jbm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm7/wAARCAALABADASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAAAgME/8QAIBAAAgICAQUBAAAAAAAAAAAAAQMCEQAEIRITM0GR4f/EABQBAQAAAAAAAAAAAAAAAAAAAAP/xAAaEQACAgMAAAAAAAAAAAAAAAAAAQIRISIx/9oADAMBAAIRAxEAPwAnag2LJLPux1fmWTsJcycmtgLPAMvuHY1EdvxQFkA0KzInURFTiFxuMuL5rCi6yhp7dP/Z";

/** The league's clock. Every date a manager reads is in it, whatever their phone
 *  says, because a deadline is the same instant for all sixteen of them and a
 *  capture is filed under the day it happened here.
 *
 *  Deliberately not the football calendar's timezone even though they agree
 *  today: this is our league's, and the two are separate questions. */
export const LEAGUE_TIMEZONE = "Europe/London";

/** A date as the league's own day, `YYYY-MM-DD`. `en-CA` because it is the
 *  sortable spelling; nothing formatted by it reaches a screen.
 *
 *  One formatter for three callers — the front page's running order, the Team
 *  Sheet's day key and the capture paths each built their own, and one of them
 *  rebuilt it on every call. A day key that disagreed between them would file a
 *  23:30 conference under the wrong date. */
export function londonDay(at: Date): string {
  return DAY_KEY.format(at);
}

const DAY_KEY = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  timeZone: LEAGUE_TIMEZONE,
});

/** The zone Fantrax stamps its own dates in, which is NOT ours.
 *
 *  `LeagueTransaction.processedAt` is `"Wed Sep 2, 2026, 6:11AM"` with no offset
 *  in it, and the offset is in their column heading instead — in English, as
 *  "Date Processed (EDT)". So this is a recorded provider fact, not a preference.
 *
 *  **It is for ORDERING and for naming the zone on screen, never for converting
 *  a stamp into an instant.** `inbox/when.ts` uses it to put an ISO deadline and
 *  a Fantrax stamp into one calendar so they can be compared; nothing turns their
 *  string into a time we then print as London. The whole point of keeping their
 *  string verbatim is that a converted transaction can move a day. */
export const FANTRAX_TIMEZONE = "America/New_York";

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

/** How stale a printed ARTICLE may be, in seconds.
 *
 *  **A story is published by a DEPLOY, not by a revalidation** — `paper.ts`
 *  static-imports `data/editions/paper.json`, so the prose is baked into the
 *  bundle and cannot change until the next build, and `vercel.json` deliberately
 *  does not exclude `data/editions` from the build trigger. The commit that
 *  files a story is the commit that ships it.
 *
 *  So the inside pages spent `PAGE_REVALIDATE` re-rendering prose that was
 *  compiled in: 2,880 re-renders a day, each one a Fantrax read, to produce
 *  bytes that could not have moved. What genuinely is live on those pages is the
 *  furniture — a manager's team name, a crest — and none of it changes within
 *  five minutes.
 *
 *  The FRONT page is the exception and keeps `PAGE_REVALIDATE`: its scoreboard
 *  strip carries live head-to-head totals while a round is on, which is the one
 *  thing on the paper that moves in thirty seconds.
 *
 *  Same literal-at-every-site rule as its neighbour above. */
export const ARTICLE_REVALIDATE = 300;

/** How often an open page asks the server for a fresh render, in seconds.
 *
 *  `live` matches the page's own lifetime deliberately — polling faster than the
 *  page can change is work that returns the same bytes. Between matches nothing
 *  moves quickly enough to justify the wake-ups. */
export const POLL = {
  live: PAGE_REVALIDATE,
  idle: 300,
} as const;
