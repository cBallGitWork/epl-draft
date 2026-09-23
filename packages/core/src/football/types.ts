// The FOOTBALL layer: the real Premier League from FPL's public API. Nothing here knows about a
// fantasy league, so it survives the league engine being replaced in 27/28.

/** A Premier League club. `code` keys the crest and is stable across seasons; `id` is per season. */
export interface Club {
  id: number;
  code: number;
  name: string;
  /** Three letters, e.g. "ARS". */
  shortName: string;
}

/** A real footballer. `code` is stable across seasons; `id` is per season and must not be persisted.
 *  No position: that is a rule of whichever game is played, so it lives in the league layer. */
export interface FootballPlayer {
  id: number;
  code: number;
  /** Short display name, e.g. "Saka". */
  name: string;
  fullName: string;
  clubId: number;
  /** "a" available, "i" injured, "s" suspended, "d" doubtful, "u" unavailable. */
  status: string;
  /** FPL's availability note; empty when there is nothing to say. */
  news: string;
  /** When that note was attached, ISO; null with no note. */
  newsAdded: string | null;
  /** 0–100 chance of playing the next round; null when FPL has no opinion. */
  chanceOfPlaying: number | null;
  /** Opta's id, the bridge to other providers. */
  optaCode: string | null;
  /** ISO date, or null where FPL has not filled it in. */
  birthDate: string | null;
  season: SeasonTotals;
}

/** A player's season to date from FPL's bootstrap. Present on every element, so nought means
 *  nought, never "missing". */
export interface SeasonTotals {
  /** FPL's count of what the competition counts. Never on a fantasy screen beside a Fantrax figure
   *  (DESIGN §7); on `/prem` it simply is the Premier League's count. */
  goals: number;
  assists: number;
  cleanSheets: number;
  minutes: number;
  /** Appearances from the start: a substitute has minutes and no start. */
  starts: number;
  expectedGoals: number;
  expectedAssists: number;
  expectedGoalsConceded: number;
  /** FPL's indices, as season TOTALS: divide by ninety before comparing two players. */
  influence: number;
  creativity: number;
  threat: number;
  tackles: number;
  /** One figure: FPL never publishes the three separately. */
  clearancesBlocksInterceptions: number;
  recoveries: number;
  saves: number;
  goalsConceded: number;
  bonus: number;
  /** FPL's bonus-points score, the number the bonus is derived from. */
  bps: number;
}

export type FixtureStatus = "upcoming" | "live" | "finished";

/** A real Premier League match. */
export interface Fixture {
  id: number;
  /** Season-stable, and the join to the Premier League's API (`altIds.opta` is `g` + this). */
  code: number;
  gameweek: number | null;
  homeClubId: number;
  awayClubId: number;
  /** ISO kickoff; null when scheduled but undated (TV picks). */
  kickoff: string | null;
  homeScore: number | null;
  awayScore: number | null;
  status: FixtureStatus;
  /** Whether FPL has added the bonus. `status` says the whistle went; this says the numbers stopped. */
  settled: boolean;
  /** Minutes played, as FPL reports it. */
  minutes: number;
  /** FPL's 1–5 difficulty per side; null when unpublished, never defaulted to 3. */
  homeDifficulty: number | null;
  awayDifficulty: number | null;
}

/** The events that move a fantasy score or change who is on the pitch; the mapper drops the rest.
 *  `disallowed-goal` is never also a `goal`, so counting goals reproduces every scoreline. */
export type MatchEventKind =
  | "goal"
  | "penalty-goal"
  | "own-goal"
  | "disallowed-goal"
  | "yellow-card"
  | "red-card"
  | "substitution";

/** One thing that happened in a match and its minute, from the Premier League's own feed. */
export interface MatchEvent {
  /** The provider's id, stable across polls: key lists on it. */
  id: number;
  /** FPL's fixture code, read off `altIds.opta`. */
  fixtureCode: number;
  kind: MatchEventKind;
  /** The printed clock — `"07"`, `"45+2"` — for reading, never sorting. */
  minute: string;
  /** Seconds from this fixture's kickoff: orders one match, not a round. The provider's field runs
   *  backwards across the interval, but only on kinds this type excludes. */
  seconds: number;
  /** Kickoff plus `seconds`, epoch ms: the only order across fixtures. Null without a kickoff time. */
  absolute: number | null;
  /** Opta's sentence, verbatim: we reprint the wire, never write it. */
  text: string;
  /** FPL codes, POSITIONAL by kind: goal `[scorer, assister?]`, own/disallowed goal `[scorer]`, card
   *  `[booked]`, substitution `[on, off]`. Null holds an unresolved man's place, so an assister is
   *  never promoted to scorer. */
  players: (number | null)[];
}

/** One player in one match as raw countable events, never fantasy points: the league layer scores. */
export interface PlayerMatchStats {
  playerId: number;
  fixtureId: number;
  minutes: number;
  goals: number;
  assists: number;
  cleanSheet: boolean;
  goalsConceded: number;
  ownGoals: number;
  penaltiesSaved: number;
  penaltiesMissed: number;
  yellowCards: number;
  redCards: number;
  saves: number;
  bonus: number;
  /** FPL's bonus-points score: a neutral "who played well" under anyone's rules. */
  bps: number;
  defensiveContribution: number;
  expectedGoals: number;
  expectedAssists: number;
  /** A round total, like the four above it: never sum it across one round's rows. */
  starts: number;
  /** FPL's own points for THIS fixture. Never in a column headed `FPts`, which is Fantrax's. */
  fplPoints: number;
}

/** Everything the football layer knows right now, assembled by the FPL adapter for the UI. */
export interface FootballSnapshot {
  clubs: Club[];
  players: FootballPlayer[];
  fixtures: Fixture[];
  /** Per-player stats for the gameweek in view; empty before kickoff. */
  stats: PlayerMatchStats[];
  /** The gameweek described: the one in focus unless another was asked for. */
  gameweek: number;
  /** ISO deadline of that gameweek. */
  deadline: string | null;
  /** Every gameweek the season has, ascending. Read the bounds here; never assume 38. */
  gameweeks: number[];
  /** When this was assembled, so staleness can be shown. */
  fetchedAt: string;
  /** FPL's sign-off on the round. Nothing prints "Final" without it. */
  dataChecked: boolean;
  /** FPL's live endpoint failed, as against having nothing yet. Both leave `stats` empty, so without
   *  this a failed read shows every player on nought as fact. */
  statsUnavailable: boolean;
}
