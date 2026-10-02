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

/** FPL's own site, where a reader goes; the API under it is where we read. */
export const FPL_SITE = "https://fantasy.premierleague.com";
export const FPL_API_BASE = `${FPL_SITE}/api`;

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
 *  Its own `cache-control` is `max-age=30`, which is the app's `PAGE_REVALIDATE` — asking
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

/** A video's still, drawn as the click-to-play thumbnail a match report opens on. */
export const YOUTUBE_THUMB_BASE = "https://i.ytimg.com/vi";

/** Scout's free team-news page: every club's predicted eleven on one page. No trailing
 *  slash — with one, the site 301s. */
export const SCOUT_TEAM_NEWS_URL = "https://www.fantasyfootballscout.co.uk/team-news";

/** The BBC's football wire, which the paper's writer reads for angles. */
export const BBC_FOOTBALL = "https://feeds.bbci.co.uk/sport/football/rss.xml";

/** The paper's writer and its illustrator. Scripts only: the app calls neither. */
export const ANTHROPIC_MESSAGES_URL = "https://api.anthropic.com/v1/messages";
export const OPENAI_IMAGES_URL = "https://api.openai.com/v1/images/generations";

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

/** Fantrax's public read surface. Unauthenticated, and — unlike FPL — it answers
 *  HTTP 200 even when it is refusing you (see league/fantrax/errors.ts). */
export const FANTRAX_FXEA_BASE = "https://www.fantrax.com/fxea/general";

/** The commissioner's setup wizard, which `roster-limits` scrapes. Needs the cookie. */
export const FANTRAX_SETUP_PAGE = "https://www.fantrax.com/newui/fantasy/createLeague.go";

/** Fantrax's own SPA API, the surface their website talks to.
 *
 *  A different protocol from fxea, not a different path on it: one POST carrying
 *  a batch of `msgs`, and failures reported in a different envelope again (see
 *  league/fantrax/errors.ts). Several useful reads are public here — the
 *  transaction history among them — so this is not the authenticated surface.
 *  Anything needing a session cookie takes it as an argument. */
export const FANTRAX_FXPA_BASE = "https://www.fantrax.com/fxpa/req";

/** Fantrax's website, for handing a manager back to it. Deeper paths are only ones seen in a real browser. */
const FANTRAX_APP_BASE = "https://www.fantrax.com/fantasy/league";

/** The signed-in manager's own roster for one period, off Craig's browser URL (30 Sep 2026); appends to
 *  `FANTRAX_LEAGUE_PAGE/` and takes `;period={n}`. */
export const FANTRAX_ROSTER_PATH = "team/roster";

/** The league's pending claims and trades, off Craig's URL (1 Oct 2026); only a member's own session reads them. */
export const FANTRAX_PENDING_PATH = "transactions/pending";

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
 *  (PLATFORM_NOTES). It hangs off `FANTRAX_LEAGUE_PAGE/`. */
export const FANTRAX_PLAYERS_PATH = "players;statusOrTeamFilter=ALL;pageNumber=1";

/** The league's home page, off Craig's browser URL (1 Oct 2026); appends to `FANTRAX_LEAGUE_PAGE/`. */
export const FANTRAX_HOME_PATH = "home";

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

/** Minutes in a half: the clock's first half reads this or less, added time aside. */
export const HALF_MINUTES = 45;

/** The league this process serves: the environment's `FANTRAX_LEAGUE_ID`, set in Vercel for the
 *  app, and nothing in the code names one. The 10 Oct swap is that one value; CI asks production
 *  for it (`/api/league`) rather than keeping a copy. Empty when unset, and `requireLeague` is
 *  how an edge refuses to run on nothing. The ids are public: they are in the league URLs. */
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

/** How long before the lock a save to Fantrax stops being taken: the commissioner's write can override a
 *  locked team, so a clock or a lock a few minutes out must fail short of it (Craig, 30 Sep 2026). */
export const SAVE_MARGIN_MINUTES = 10;

/** Where the Premier League serves its crests.
 *
 *  `next.config.ts` builds the image allow-list from this and the three below. */
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
export const FPL_SHIRT_BASE = `${FPL_SITE}/dist/img/shirts/standard`;

/** Where Fantrax serves the badge a manager picked for his fantasy team.
 *
 *  A prefix and not just a host, because it is a gate as well as an address:
 *  `next.config.ts` allow-lists exactly this path for the image optimizer, and a
 *  badge URL from anywhere else makes `next/image` throw — which takes down a
 *  whole page rather than losing one 26px icon. `getTeamRosterInfo` carries
 *  `logoUploaded`, so a custom upload served from some other path is a state
 *  this league can reach; `mapTeamBadges` drops any URL that is not under here
 *  and the team shows its initial instead. */
export const FANTRAX_BADGE_BASE =
  "https://fantraximg.com/assets/images/icons/fantasyteams";

/** The league's clock. Every date a manager reads is in it, whatever their phone
 *  says, because a deadline is the same instant for all sixteen of them and a
 *  capture is filed under the day it happened here.
 *
 *  Deliberately not the football calendar's timezone even though they agree
 *  today: this is our league's, and the two are separate questions. */
export const LEAGUE_TIMEZONE = "Europe/London";

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

/** How many matches ahead a player's fixture run reads: eight fills a phone's row and a desk's. */
export const FIXTURE_RUN = 8;

/** How many gameweeks Data's planner, club board and projections look ahead (Craig, 24 Sep 2026: "next 6
 *  gameweeks"): a little past a player's own run, because a manager plans a squad further out than one man. */
export const PLANNER_RUN = 6;

/** How many transaction rows to ask for in one page.
 *
 *  Their own client sends 100 and the response reports `totalNumPages` back, so
 *  a league busy enough to overflow a page says so rather than quietly serving
 *  the first hundred as if they were all of it. Sixteen teams will not reach it
 *  in a season. */
export const TRANSACTION_PAGE_SIZE = 100;

/** Lawro's predictions: when the column files and how a tie is called. Tuned against a league
 *  nobody has drafted yet, so retune after gameweek 9 by counting the gut calls in the archive. */
export const PREDICTIONS = {
  /** Thursday from 18:00 London; a lock earlier in the week files the evening before (Sunday = 0). */
  filing: { weekday: 4, hour: 18, maxLeadDays: 4 },
  /** A tie is close when the gap is at most this share of the favourite's total: 3 points on 40. */
  closeShare: 0.08,
  /** FPL publishes 0/25/50/75/100; at or below this the favourite's best man is a doubt. */
  doubtChance: 50,
  /** Ranks of defensive ease by which the underdog's back line must have the kinder round. */
  defenceEdge: 3,
  /** How many more Liverpool men the underdog must hold, and whose they are (FPL's club code). */
  liverpoolLead: 1,
  liverpoolCode: 14,
  /** Liverpool reaches further than the football does: 159 BBC games without having them lose. */
  liverpoolShare: 0.15,
  /** The brief's caps: key men a side, how deep it looks for doubts, what counts as a hard fixture. */
  keyMen: 3,
  /** How many of his last columns make a man old news, unless something is new for him. */
  wornColumns: 2,
  doubtDepth: 6,
  hardFixtures: 5,
  /** A fixture among the kindest this many is an easy one; the last games a man's form is read from. */
  kindFixtures: 5,
  recentGames: 2,
  factsPerTie: 11,
} as const;

/** The draft match-up desk's talking points (Craig, 29 Sep 2026). */
export const DRAFT_DESK = {
  /** A man off before this many minutes, with his match done; and the hour a clean sheet needs. */
  earlyOff: 60,
  /** A clean sheet is told, won or lost late, only where the slot pays at least this for one: a midfielder's 1 is not
   *  (Craig, 30 Sep 2026: "dont reference midfielder clean sheet points"). */
  cleanSheetStory: 4,
  /** A keeper's score that is a haul, clean sheet and saves together. */
  keeperHaul: 8,
  /** A reserve's score that is a talking point though it counts for nobody (Craig, 29 Sep 2026: "a bench player getting
   *  a good score (6+)"). */
  benchScore: 6,
  /** The sums of what the side behind needs are worked only when this few men are left across both sides; with more,
   *  half the gameweek is unplayed and the report tells what happened (Craig, 29 Sep 2026). */
  chaseWhenLeft: 3,
  /** A goal from this minute is late: a scorer's late goal, or the one that took a clean sheet. */
  lateGoal: 80,
  /** Wins or defeats in a row that make a streak; results unbeaten or without a win, a draw among them, that make a run. */
  streak: 3,
  unbeaten: 4,
  /** Gameweeks without a win before a win is a return to form, and gameweeks of a side's own before its high or low counts. */
  formReturn: 3,
  /** The league's gameweek from which a score or a margin can be a season record. */
  recordsFrom: 4,
  /** Places a side must climb or fall in the table to be news: any move of a match-up's own sides. */
  tableMove: 1,
  /** Meetings, every one won by one side, before a clean sweep is news. */
  sweepFrom: 2,
} as const;

/** The draft desk's news judgement (Craig, 30 Sep 2026: "i told you to create a narrative"): what each thread of a
 *  match-up is worth to its story, the bigger version second where there is one, and the thresholds that make one. */
export const DRAFT_NEWS = {
  weight: {
    // The match's shape, at the end of the gameweek.
    "bench-turned": [90], "late-decider": [80, 90], comeback: [75, 85], "one-man-show": [70], level: [65], close: [55, 65],
    "lead-lost": [60], "fightback-short": [60], upset: [60, 75], rout: [50, 60], "turning-point": [40], "days-won": [55],
    "same-match": [35],
    // A man's.
    injury: [50], crossfire: [50], haul: [45], "keeper-haul": [45, 60], "clean-lost-late": [45], "bench-six": [40, 55],
    "uncovered-blank": [35, 55], "late-goal": [35, 45], "star-blank": [35], "non-starter": [30, 45], "club-mates": [30, 40],
    "old-boy": [25, 45], "new-arrival": [25, 45], debut: [20, 40], "early-off": [25], double: [20],
    // The season's, each tagged for a Football Manager frame.
    top: [55], record: [50], "streak-ended": [45], "return-to-form": [45], bottom: [45], streak: [40], "season-high": [35],
    "season-low": [35], "stayed-top": [35], climb: [30], fall: [30], "meetings-won": [30],
    // After Saturday, with the gameweek to finish.
    // A reserve waiting on his match is a twist, never the lede with half the gameweek to play (GW5's proof).
    chase: [80], "subs-waiting": [50], "to-play-gap": [55], "saturday-lead": [45, 60], "both-to-come": [45],
    "double-to-come": [40], "going-in": [35],
  },
  /** Added to the one thread that decided a result, to one other whose points reach the margin, and after Saturday to
   *  the man who built the lead. */
  decider: 30,
  reachesMargin: 15,
  builder: 20,
  /** A keeper's haul is worth this much more a point past its threshold, up to its bigger weight. */
  keeperHaulPerPoint: 5,
  /** Down by this many at a day's end and won: a comeback, a big one from the second. Ahead by the third and lost: a lead
   *  lost. Down by the fourth and lost by the fifth or fewer: a fightback that fell short. */
  comebackFrom: 6,
  bigComebackFrom: 10,
  leadLostFrom: 1,
  fightbackFrom: 8,
  fightbackWithin: 3,
  /** A margin this small is close; this big a rout, and the second a big one; after Saturday the third is a big lead. */
  closeWithin: 3,
  routFrom: 15,
  bigRoutFrom: 25,
  bigLead: 15,
  /** A man with this many points and this share of his side's total carried it. */
  oneManPoints: 10,
  oneManShare: 0.35,
  /** The winner this many places lower is an upset, from this gameweek of the league's on. */
  upsetPlaces: 4,
  upsetFrom: 4,
  /** A blank by one of the match-up's top few projected men is news, from this gameweek on; the projection never prints. */
  starBlankTop: 3,
  starBlankFrom: 6,
  /** After Saturday, one side with this many more men to play than the other. */
  toPlayGap: 3,
  /** The angle: a twist and a supporting thread must score this much, a supporting thread for the other side this much;
   *  at most this many supporting threads and this many men in the cast. */
  twistFrom: 50,
  supportingFrom: 35,
  otherSideFrom: 30,
  supporting: 3,
  cast: 4,
  /** A thread of the family this side's story had last time is worth this share of itself, one about a man in last
   *  time's cast this share; two match-ups on a page share a story's family only when the next-best is this far behind. */
  repeatFamily: 0.6,
  repeatMan: 0.7,
  varietyWithin: 15,
} as const;

/** How long a draft report's paragraphs run after each match-up's verdict (the UK desk's review, 29 Sep 2026). */
export const DRAFT_WRITING = {
  /** Words a match-up runs to, lede included; the lead match-up may run to `leadWords`. */
  matchupWords: [50, 120],
  leadWords: 170,
  /** Headline candidates the pun writer offers, and match-ups written in one call. */
  puns: 10,
  /** Filed draft reports read back, so a story, a phrase or a headline is not told the same way twice. */
  pastReports: 4,
  /** A list, not a report (listChecks.ts). A sentence naming this many men with two figures, or carrying this many
   *  figures, is a roll-call, and so is a paragraph of this many sentences each opening on a man. */
  rollCallMen: 3,
  rollCallFigures: 3,
  rollCallParagraph: 3,
  /** Two sentences in a row whose first this-many words take the same shape. */
  openerWords: 4,
  /** The most men a match-up names, the lead and the rest. */
  leadMen: 7,
  men: 5,
  /** A run of this many words from THE STORY in the lede is the brief copied; this many from a side's last report is
   *  an echo. */
  copied: 6,
  echo: 4,
  /** The fact checker's fixes made in one match-up at most: past that, the writing is the problem, not a sentence. Its
   *  token budget, thinking included. */
  factFixes: 4,
  factTokens: 24000,
} as const;

/** The team sheets at the lock: when a benched man is news, and how much the article carries. */
export const SHEETS = {
  /** A benched man is news with a goal or assist last time out, or this many goals and assists
   *  over his last few rounds. At most this many benchings a side, and meeting points a fixture. */
  benchForm: 2,
  benchings: 2,
  crossovers: 2,
  /** Form over this many rounds: scoring in every one, this many goals, or this many goals and
   *  assists together; at most this many men a side. */
  formRounds: 3,
  formGoals: 3,
  formInvolvements: 4,
  form: 2,
  /** How far back a Fantrax report may name a doubtful or injured man's complaint: two months,
   *  because an injury story can be old and still true. */
  injuryDays: 60,
  /** A side's notes beyond its changes, weightiest first: what a three-sentence paragraph can carry. */
  notes: 3,
  /** A side's paragraph: sentences and words at most; a phrase this long shared is an echo. */
  sentences: 3,
  words: 80,
  echo: 5,
  /** Paragraphs that may open with the same three words, a name blanked. */
  openers: 2,
} as const;

/** The Points Dodgers: men who came close to points and got none (Craig, 30 Sep 2026). */
export const DODGERS = {
  /** Men the column names, and how near a man must come: expected goals, or expected assists (Craig: "players with
   *  high xa and no assist points"), plus the weights below. An assist side is scaled to the goal bar. */
  shown: 5,
  from: { goal: 0.6, assist: 0.4 },
  /** A goal against from this minute is the one that took a clean sheet late. */
  lateGoal: 80,
  /** What each moment adds to his nearness; a shot's own expected goals already counts once. */
  weight: { "ruled-out": 1, "penalty-missed": 0.5, "penalty-saved": 0.5, woodwork: 0.5, "set-up-woodwork": 0.3, "clean-sheet-lost": 1 },
} as const;

/** The match-day report's editorial thresholds (docs/plans/GAZETTA.md, "Match reports, woven"). */
export const REPORTS = {
  budget: {
    lead: { account: [180, 260], sections: 3, stats: 9 },
    ordinary: { account: [120, 190], sections: 2, stats: 8 },
    dead: { account: [60, 110], sections: 1, stats: 6 },
  },
  /** Words a standfirst and a section may run to (sports desk, 28 Sep 2026). */
  standfirstWords: 25,
  sectionWords: [20, 45],
  /** A burst is two goals by one side this close; late is from this minute. */
  burstMinutes: 15,
  lateMinute: 80,
  cleanSheetLostFrom: 75,
  /** The ball in words: "most of" from, "more of" from. Never printed as a figure. */
  ball: { most: 60, more: 55 },
  /** A key-stats line earns its place past these. xA only chooses; it never prints. */
  stats: { mostShots: 4, chances: 3, expectedAssists: 0.4, saves: 5 },
  /** Chances not taken the account is handed: close-range misses and saves, at most `most`; and the men whose chances
   *  added up to at least `expectedGoals` without a goal, told in words. */
  missed: { most: 3, expectedGoals: 0.5 },
  /** Candidates offered beyond the sections a match gets. */
  spareNominees: 3,
  /** A run of this many words shared with another match, or a recent report, is an echo. */
  echo: 4,
  /** The fan's quotes kept for any one part of a piece. */
  fanFlags: 3,
  /** Earlier report days whose phrasing a new one may not echo. */
  pastDays: 4,
  /** Matches written in one call; a longer day is split, the later call shown what is already on the page. */
  perCall: 5,
} as const;

/** The Bin XI: the best eleven nobody has, filed on Tuesday before Wednesday's waivers. */
export const BIN_XI = {
  /** The London weekday it files on: the one day with no league event. */
  weekday: "Tue",
  /** How far the chances a man made or missed move his points when picking: a 9 still beats a 5. */
  luck: 0.5,
  /** Key-stats lines: how many men a top-xG or top-xA line names, and the least that earns a place. */
  stats: { topMen: 3, expectedGoals: 0.2, expectedAssists: 0.15 },
  /** The column's length, in words, and its paragraphs. */
  words: [150, 220],
  paragraphs: 3,
} as const;
