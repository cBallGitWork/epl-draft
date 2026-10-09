// Every cross-cutting constant (CODE_RULES §3). Imports only the paper's tuning; one environment read, `FANTRAX_LEAGUE_ID`.

// Core has no node types, so nothing here can reach for `fs`; this declares the one global it reads.
declare const process: { env: Record<string, string | undefined> };

/** The competition, as our members know it. */
export const LEAGUE_NAME = "Tim Hortons Pro League";

/** The football competition as the desk heads it: CM 99/00's own name, since FPL publishes none. */
export const COMPETITION_NAME = "FA Barclays Premiership";

/** The season's cuts from each end of the table; `relegate` counts up from the bottom. FPL publishes neither. */
export const PREMIERSHIP_CUTS = { qualify: 4, relegate: 3 };

/** Premier League season this build targets, in FPL's own notation. */
export const SEASON = "2026/27";

/** FPL's own site, where a reader goes; the API under it is where we read. */
export const FPL_SITE = "https://fantasy.premierleague.com";
export const FPL_API_BASE = `${FPL_SITE}/api`;

/** The Premier League's football API. Server-side only: its CORS answers premierleague.com alone. Its CDN
 *  caches for 30 s, the app's `PAGE_REVALIDATE`, so asking faster returns the same bytes. */
export const PL_FOOTBALL_API_BASE = "https://footballapi.pulselive.com/football";

/** The Premier League's own id for `SEASON`, from `/football/competitions/1/compseasons`: it changes every
 *  summer and cannot be computed. */
export const PL_COMP_SEASON = 841;

/** Premier League competition id; the same API serves other competitions under other numbers. */
export const PL_COMPETITION = 1;

/** Commentary lines asked for at once: above any whole match, so the client never pages. */
export const PL_TEXTSTREAM_PAGE = 300;

/** The rights holder's highlights playlist and its public feed: no key, the latest 15 entries. The id changes every summer. */
export const HIGHLIGHTS_PLAYLIST = "PLUY_YSABhemI";
export const YOUTUBE_FEED_BASE = "https://www.youtube.com/feeds/videos.xml";

/** Where a highlights video is embedded from, YouTube's privacy host: never fetched, never re-hosted. */
export const YOUTUBE_EMBED_BASE = "https://www.youtube-nocookie.com/embed";

/** A video's still, drawn as the click-to-play thumbnail a match report opens on. */
export const YOUTUBE_THUMB_BASE = "https://i.ytimg.com/vi";

/** Scout's team-news page, every club's predicted eleven. No trailing slash: with one, the site 301s. */
export const SCOUT_TEAM_NEWS_URL = "https://www.fantasyfootballscout.co.uk/team-news";

/** The paper's writer and its illustrator. Scripts only: the app calls neither. */
export const ANTHROPIC_MESSAGES_URL = "https://api.anthropic.com/v1/messages";
export const OPENAI_IMAGES_URL = "https://api.openai.com/v1/images/generations";

/** A real browser's user agent: both providers' WAFs challenge an unfamiliar one. */
export const HTTP_USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";

/** Attempts after the first when a provider is busy: enough for a blip, not an outage. */
export const HTTP_RETRIES = 2;

/** First backoff step in milliseconds; doubles per attempt, plus jitter. */
export const HTTP_BACKOFF_BASE_MS = 500;

/** Longest Retry-After worth waiting out; a longer one goes back at once rather than stall a render. */
export const HTTP_RETRY_AFTER_MAX_MS = 5_000;

/** How much of a body that was not JSON an error quotes: enough to tell a WAF page from a cut-off. */
export const HTTP_BODY_SAMPLE_CHARS = 120;

/** How long one provider request may take before it is abandoned; the 1.3 MB bootstrap fits. */
export const FETCH_TIMEOUT_MS = 15_000;

/** How long a model call may take. A whole column is minutes, not seconds. */
export const MODEL_TIMEOUT_MS = 300_000;

/** How long a firing may commission stories: half the Editions job's 20 minutes, so the story in flight and the commit still fit. */
export const EDITION_BUDGET_MS = 600_000;

/** Fantrax's public read surface: unauthenticated, and it answers HTTP 200 even when it is refusing you. */
export const FANTRAX_FXEA_BASE = "https://www.fantrax.com/fxea/general";

/** The commissioner's setup wizard, which `roster-limits` scrapes. Needs the cookie. */
export const FANTRAX_SETUP_PAGE = "https://www.fantrax.com/newui/fantasy/createLeague.go";

/** Fantrax's SPA API: one POST carrying a batch of `msgs`. Some reads are public; a session cookie is an argument. */
export const FANTRAX_FXPA_BASE = "https://www.fantrax.com/fxpa/req";

/** Fantrax's website, for handing a manager back to it. Deeper paths are only ones seen in a real browser. */
const FANTRAX_APP_BASE = "https://www.fantrax.com/fantasy/league";

/** The signed-in manager's own roster for one period; appends to `FANTRAX_LEAGUE_PAGE/` and takes `;period={n}`. */
export const FANTRAX_ROSTER_PATH = "team/roster";

/** The league's pending claims and trades; only a member's own session reads them. */
export const FANTRAX_PENDING_PATH = "transactions/pending";

/** One player on Fantrax. Append `/{scorerId}/{leagueId}`: `/{scorerId}` alone draws a blank page. */
export const FANTRAX_PLAYER_BASE = "https://www.fantrax.com/player";

/** The league's player list, where a claim is made, as a real browser URL has it; appends to `FANTRAX_LEAGUE_PAGE/`. */
export const FANTRAX_PLAYERS_PATH = "players;statusOrTeamFilter=ALL;pageNumber=1";

/** The league's home page; appends to `FANTRAX_LEAGUE_PAGE/`. */
export const FANTRAX_HOME_PATH = "home";

/** Fantrax's sport code for the Premier League. `SOCCER` is a different sport to them and returns the wrong pool. */
export const FANTRAX_SPORT = "EPL";

/** Minutes on the pitch before a clean sheet is previewed, FPL's threshold: Fantrax publishes none and settles at
 *  full time, when its answer replaces ours. */
export const CLEAN_SHEET_MINUTES = 60;

/** Minutes in a half: the clock's first half reads this or less, added time aside. */
export const HALF_MINUTES = 45;

/** Minutes in a whole match, added time aside: what a per-90 rate and a full appearance are measured over. */
export const FULL_MATCH_MINUTES = 2 * HALF_MINUTES;

/** Minutes past its kickoff that a match FPL still has as not started counts as called off: FPL leaves a postponed
 *  fixture dated, which held the round under way, and the live poll rate, for days. */
export const POSTPONED_AFTER_MINUTES = 180;

/** The league this process serves, from the environment; nothing in the code names one. Empty when unset, so an
 *  edge calls `requireLeague`. The ids are public: they are in the league URLs. */
export const FANTRAX_LEAGUE_ID = process.env.FANTRAX_LEAGUE_ID ?? "";

/** The served league on Fantrax's website; a deeper page appends `/{path}`. */
export const FANTRAX_LEAGUE_PAGE = `${FANTRAX_APP_BASE}/${FANTRAX_LEAGUE_ID}`;

/** The league id, or a throw that says where to set it. */
export function requireLeague(leagueId: string): string {
  if (leagueId.trim() === "") {
    throw new Error(
      "FANTRAX_LEAGUE_ID is not set. It names the league to serve: Vercel's environment for the " +
        "app, apps/companion/.env.local for `next dev`, the shell for a script.",
    );
  }
  return leagueId;
}

/** The league's Matchups for one period; appends to `FANTRAX_LEAGUE_PAGE/` and takes `;period={n}`. */
export const FANTRAX_MATCHUPS_PATH = "livescoring";

/** Players per page from Fantrax's stats read: above the whole pool, so it arrives in one request. The read
 *  reports the total, so an overflow says so rather than showing a prefix. */
export const POOL_PAGE_SIZE = 2000;

/** Minutes before a period's first kickoff (not its boundary) that lineups lock: a commissioner setting no API we
 *  read exposes. If he moves it, only this knows, and the app prints the wrong deadline. */
export const LINEUP_LOCK_LEAD_MINUTES = 15;

/** Minutes before the lock that a save to Fantrax stops being taken: the commissioner's write can override a
 *  locked team, so a save must fail short of the lock. */
export const SAVE_MARGIN_MINUTES = 10;

/** Where the Premier League serves its crests. `next.config.ts` builds its image allow-list from the image bases here. */
export const PL_ASSET_BASE = "https://resources.premierleague.com/premierleague";

/** Where the Premier League serves player portraits, as `{code}.png`. `premierleague25` is theirs verbatim and not a
 *  season: never compute it (`premierleague26` answers 502). */
export const PL_PHOTO_BASE = "https://resources.premierleague.com/premierleague25";

/** Where FPL serves club kits, chosen by club code, so a transfer changes the shirt the same day. */
export const FPL_SHIRT_BASE = `${FPL_SITE}/dist/img/shirts/standard`;

/** The league's clock: every date a manager reads, whatever his phone says, and the day a capture is filed under. */
export const LEAGUE_TIMEZONE = "Europe/London";

/** The zone Fantrax stamps its transactions in ("Date Processed (EDT)"), which is NOT ours. */
export const FANTRAX_TIMEZONE = "America/New_York";

/** How far a man's xMins must move, in whole minutes, before the scout writes it up: more than this (Craig, 7 Oct 2026). */
export const XMINS_MOVE = 10;

/** How many saves are worth mentioning; one or two says nothing. Every view that prints saves judges by this. */
export const NOTABLE_SAVES = 4;

/** How many matches ahead a player's fixture run reads: eight fills a phone's row and a desk's. */
export const FIXTURE_RUN = 8;

/** How many gameweeks Data's planner, club board and projections look ahead: past a player's own run, because a
 *  manager plans a squad further out than one man. */
export const PLANNER_RUN = 6;

/** Transactions per page of the log (a claim and its drop are one); `fetchTransactions` reads every page. */
export const TRANSACTION_PAGE_SIZE = 100;

/** The paper's tuning lives with the paper; its readers import it from here. */
export * from "./gazette/editorial";
export * from "./gazette/matchups/judgement";
