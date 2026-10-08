// The paper's tuning: when each column files, how long it runs, and what is news enough to go in it.

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
  doubtDepth: 6,
  hardFixtures: 5,
  /** How many of his last columns make a man old news, unless something is new for him. */
  wornColumns: 2,
  /** A fixture among the kindest this many is an easy one; the last games a man's form is read from. */
  kindFixtures: 5,
  recentGames: 2,
  /** The most facts one tie's brief carries. */
  factsPerTie: 11,
} as const;

/** What the editor holds Lawro to in both his columns: words a sentence; sentences and words for his opening, a tie
 *  and a gut call; words a column; the phrase lengths that echo a recent column or another tie; men a tie; questions. */
export const LAWRO_LIMITS = { sentence: 20, intro: [1, 4, 40], tie: [2, 8, 120], gut: [2, 9, 130], column: 680, repeat: 5, echo: 4, men: 4, questions: 2 } as const;

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

/** The team sheets at the lock: when a benched man is news, and how much the article carries. */
export const SHEETS = {
  /** A benched man is news with a goal or assist last time out, or this many goals and assists
   *  over his last few gameweeks. At most this many benchings a side, and meeting points a fixture. */
  benchForm: 2,
  benchings: 2,
  crossovers: 2,
  /** Form over this many gameweeks: scoring in every one, this many goals, or this many goals and
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
  /** A burst is two goals by one side this close; a clean sheet let go from this minute went late. */
  burstMinutes: 15,
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

/** A goal from this minute is late: a late winner, a scorer's late goal, the one that took a clean sheet. */
export const LATE_GOAL_MINUTE = 80;

/** A match report's key stats and the Bin XI's: how many men a top-xG or top-xA line names, and the least that earns
 *  a place in it. */
export const KEY_STATS = { topMen: 3, expectedGoals: 0.2, expectedAssists: 0.15 } as const;

/** The Bin XI: the best eleven nobody has, filed on Tuesday before Wednesday's waivers. */
export const BIN_XI = {
  /** The London weekday it files on: the one day with no league event. */
  weekday: "Tue",
  /** How far the chances a man made or missed move his points when picking: a 9 still beats a 5. */
  luck: 0.5,
  /** The column's length, in words, and its paragraphs. */
  words: [150, 220],
  paragraphs: 3,
} as const;
