// The FOOTBALL layer: the real world. Clubs, players, fixtures and live match
// stats as they actually happen in the Premier League — sourced from FPL's public
// API, which needs no auth and is the same truth every fantasy provider builds on.
//
// Nothing here knows about a fantasy league. That separation is the point: in
// 27/28 the league layer gets replaced by our own engine, but this layer does not
// move, because the real world does not care who is scoring it.

/** A Premier League club. `code` is FPL's stable club code — it keys the crest
 *  asset and never changes across seasons (unlike `id`, which is per-season). */
export interface Club {
  id: number;
  code: number;
  name: string;
  /** Three-letter label, e.g. "ARS". Used everywhere space is tight. */
  shortName: string;
}

/** A real footballer. `code` keys the portrait asset and is stable across seasons;
 *  `id` is FPL's per-season element id and is NOT safe to persist between seasons.
 *
 *  There is deliberately no position here. FPL's `element_type` is FPL's own
 *  fantasy classification, not a fact about the footballer: Fantrax files the
 *  same player differently and lets them hold several positions at once.
 *  Position is a rule of whichever game is being played, so it belongs to the
 *  league layer (`league/types.ts`, `eligiblePositions`) and is never a join
 *  key. */
export interface FootballPlayer {
  id: number;
  code: number;
  /** Short display name, e.g. "Saka" — what we show on a shirt. */
  name: string;
  fullName: string;
  clubId: number;
  /** Availability: "a" available, "i" injured, "s" suspended, "d" doubtful, "u" unavailable. */
  status: string;
  /** Free-text injury/availability note from FPL, empty when there's nothing to say. */
  news: string;
  /** 0–100 chance of playing the next round; null when FPL has no opinion. */
  chanceOfPlaying: number | null;
  /** Opta's identifier, when FPL publishes it — the most reliable bridge to other
   *  data providers, so we keep it even though we don't consume it yet. */
  optaCode: string | null;
  /** What he has done across the season so far, as FPL counts it.
   *
   *  **Only the things our league does not score.** Fantrax is the authority on
   *  goals, assists and clean sheets because those are what it pays for, and
   *  printing FPL's count of the same fact beside theirs is exactly the
   *  provenance collision DESIGN §7 forbids. What FPL has and Fantrax has not is
   *  the UNDERLYING play — expected goals, tackles, recoveries — and the
   *  denominators under everything, minutes and starts. */
  season: SeasonTotals;
}

/** A player's season to date, from FPL's own bootstrap.
 *
 *  Every field is present on all 629 elements (probed 2 Sep 2026), so these are
 *  plain numbers rather than nullable: a man who has not played reads nought
 *  everywhere, which is true of him and not an absence. */
export interface SeasonTotals {
  minutes: number;
  /** Appearances from the start, which is not the same as appearances — a
   *  substitute has minutes and no start. */
  starts: number;
  expectedGoals: number;
  expectedAssists: number;
  expectedGoalsConceded: number;
  tackles: number;
  /** FPL publishes clearances, blocks and interceptions as one figure and never
   *  separately, so it is carried as the one thing it is. */
  clearancesBlocksInterceptions: number;
  recoveries: number;
  saves: number;
  goalsConceded: number;
  bonus: number;
  /** FPL's own bonus-points system score — the number the bonus is derived
   *  from, and a better reading of a performance than the bonus itself. */
  bps: number;
}

export type FixtureStatus = "upcoming" | "live" | "finished";

/** A real Premier League match. */
export interface Fixture {
  id: number;
  gameweek: number | null;
  homeClubId: number;
  awayClubId: number;
  /** ISO kickoff time; null when the match is scheduled but undated (TV picks). */
  kickoff: string | null;
  homeScore: number | null;
  awayScore: number | null;
  status: FixtureStatus;
  /** Whether FPL has added this match's bonus points.
   *
   *  `status` collapses `finished_provisional` into "finished", which is right
   *  for a reader watching a score: the referee has blown up. This is the second
   *  half of that same fact, kept apart rather than folded in, because a screen
   *  claiming a round is over and a screen claiming its numbers have stopped
   *  moving are making different promises. */
  settled: boolean;
  /** Minutes played, as FPL reports it — drives the live clock. */
  minutes: number;
  /** FPL's 1–5 fixture difficulty for each side, null when they published none.
   *
   *  Theirs, and deliberately not ours: difficulty is an opinion, and the only
   *  defensible one to print is the one the whole fantasy world is already
   *  reading. Null rather than 3, because "no opinion" and "average" are
   *  different claims and only one of them is FPL's. */
  homeDifficulty: number | null;
  awayDifficulty: number | null;
}

/** One player's contribution in one match. The fields are deliberately the raw
 *  countable events, NOT fantasy points: points depend on whose rules you apply,
 *  and this layer is rules-agnostic. The league layer scores these. */
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
  /** FPL's Bonus Points System score — useful as a neutral "who played well"
   *  signal even under someone else's scoring rules. */
  bps: number;
  defensiveContribution: number;
  expectedGoals: number;
  expectedAssists: number;
}

/** Everything the football layer knows right now. Assembled by an adapter
 *  (currently `fpl/`) and consumed by the UI, which never calls an API itself. */
export interface FootballSnapshot {
  clubs: Club[];
  players: FootballPlayer[];
  fixtures: Fixture[];
  /** Per-player match stats for the gameweek in view; empty before kickoff. */
  stats: PlayerMatchStats[];
  /** The gameweek this snapshot describes. Defaults to the one in focus — live if
   *  one is running, else the next up — but is whatever was asked for. */
  gameweek: number;
  /** ISO deadline of that gameweek. */
  deadline: string | null;
  /** Every gameweek the season has, ascending. Navigation reads its bounds from
   *  here rather than assuming 38: FPL is the authority on how long a season is. */
  gameweeks: number[];
  /** When this snapshot was assembled, so the UI can show staleness honestly. */
  fetchedAt: string;
  /** FPL's own sign-off on this gameweek — bonus added and stats reconciled.
   *
   *  The last rung of the ladder a round comes down: provisional whistle, then
   *  bonus, then this. Nothing may print the word "Final" without it, because a
   *  Final that later moves is the confident wrong answer. */
  dataChecked: boolean;
  /** True when FPL's live endpoint could not be read, as against having nothing
   *  to report yet.
   *
   *  The two are indistinguishable in `stats` — both are empty — and on a
   *  Saturday afternoon they mean opposite things. Without this a view renders
   *  every player on nought and states it as fact, which is the confident wrong
   *  number the whole layer exists to avoid. */
  statsUnavailable: boolean;
}
