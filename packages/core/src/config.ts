// Every cross-cutting constant (CODE_RULES §3). No imports; the one environment read is `FANTRAX_LEAGUE_ID`.

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

/** The BBC's football wire, which the paper's writer reads for angles. */
export const BBC_FOOTBALL = "https://feeds.bbci.co.uk/sport/football/rss.xml";

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

/** Transaction rows per page, as their own client asks; the response reports `totalNumPages`, so an overflow says so. */
export const TRANSACTION_PAGE_SIZE = 100;

/** The predicted elevens: Friday from 16:00 London, an hour after the press conferences end; a lock
 *  earlier than Tuesday's files the day before (Sunday = 0). */
export const PREDICTED_XI = { filing: { weekday: 5, hour: 16, maxLeadDays: 3 } } as const;

/** The Team Sheet: Thursday's and Friday's press conferences in one column, Friday from 17:00 London, once the Mac's
 *  16:00 import has merged (Craig, 7 Oct 2026); a lock earlier than Tuesday's files the day before (Sunday = 0). */
export const TEAM_SHEET = { filing: { weekday: 5, hour: 17, maxLeadDays: 3 } } as const;

/** Lawro's predictions: when the column files and how a tie is called. Set before any league was drafted, so
 *  retune after gameweek 9 by counting the gut calls in the archive. */
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
  /** The widest gap, as a share of the favourite's total, that a Liverpool gut call may overturn. */
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

/** Lawro's power rankings: the squads as drafted, ordered by the season played out, once, before the first lock. */
export const SEASON_RANKINGS = {
  /** Playings of the season, and the seed that makes them the same every time. */
  runs: 10_000,
  seed: 2026,
  /** The sister model's band is a 5th-to-95th percentile: its half-width is this many deviations. */
  band: 1.645,
  /** The correlation between any two men of one eleven in one period: a clean sheet lifts a back line, a rout a
   *  front line. */
  together: 0.5,
  /** A squad is clear at the top when the next is at least this many places behind it on average. */
  clear: 1,
} as const;

/** The draft match-up desk's talking points. */
export const DRAFT_DESK = {
  /** A man off before this many minutes, with his match done; and the hour a clean sheet needs. */
  earlyOff: 60,
  /** A clean sheet is told, won or lost late, only where the slot pays at least this for one: a midfielder's 1 is not. */
  cleanSheetStory: 4,
  /** A keeper's score that is a haul, clean sheet and saves together. */
  keeperHaul: 8,
  /** A reserve's score that is a talking point though it counts for nobody. */
  benchScore: 6,
  /** The sums of what the side behind needs are worked only when this few men are left across both sides; with more,
   *  half the gameweek is unplayed and the report tells what happened. */
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

/** The draft desk's news judgement: what each thread of a match-up is worth to its story, the bigger version second
 *  where there is one, and the thresholds that make one. */
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
    // After Saturday, with the gameweek to finish; a reserve waiting on his match is a twist, never the lede.
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

/** How long a draft report's paragraphs run after each match-up's verdict. */
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

/** The Points Dodgers: men who came close to points and got none. */
export const DODGERS = {
  /** Men the column names, and how near a man must come: expected goals, or expected assists, plus the weights
   *  below. An assist side is scaled to the goal bar. */
  shown: 5,
  from: { goal: 0.6, assist: 0.4 },
  /** A goal against from this minute is the one that took a clean sheet late. */
  lateGoal: 80,
  /** What each moment adds to his nearness; a shot's own expected goals already counts once. */
  weight: { "ruled-out": 1, "penalty-missed": 0.5, "penalty-saved": 0.5, woodwork: 0.5, "set-up-woodwork": 0.3, "clean-sheet-lost": 1 },
} as const;

/** The match-day report's editorial thresholds. */
export const REPORTS = {
  budget: {
    lead: { account: [180, 260], sections: 3, stats: 9 },
    ordinary: { account: [120, 190], sections: 2, stats: 8 },
    dead: { account: [60, 110], sections: 1, stats: 6 },
  },
  /** Words a standfirst and a section may run to. */
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
