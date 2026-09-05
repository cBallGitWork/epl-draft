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
  /** When that line was attached, ISO, or null when there is no line. What makes
   *  it an item on a news list rather than a state on a badge. */
  newsAdded: string | null;
  /** 0–100 chance of playing the next round; null when FPL has no opinion. */
  chanceOfPlaying: number | null;
  /** Opta's identifier, when FPL publishes it — the most reliable bridge to other
   *  data providers, so we keep it even though we don't consume it yet. */
  optaCode: string | null;
  /** ISO `1995-09-15`, or null for the nineteen in six hundred FPL has not
   *  filled in. Championship Manager opens every profile with this line, and it
   *  is the only thing on that line we hold ourselves. */
  birthDate: string | null;
  /** What he has done across the season so far, as FPL counts it.
   *
   *  Two kinds of number, and the difference is who is entitled to state it.
   *  The UNDERLYING play — expected goals, tackles, recoveries, and the
   *  denominators under everything — is FPL's alone; Fantrax publishes none of
   *  it. The three the competition itself counts are carried too, and
   *  `SeasonTotals` records the bound they come with. */
  season: SeasonTotals;
}

/** A player's season to date, from FPL's own bootstrap.
 *
 *  Every field is present on all 651 elements (probed 2 Sep 2026), so these are
 *  plain numbers rather than nullable: a man who has not played reads nought
 *  everywhere, which is true of him and not an absence. */
export interface SeasonTotals {
  /** What the competition counts him for: goals, assists, clean sheets.
   *
   *  **These were deliberately absent until 2 Sep 2026**, on the rule stated
   *  below: Fantrax is the authority on what Fantrax pays for, and printing
   *  FPL's count of the same fact beside theirs is the provenance collision
   *  DESIGN §7 forbids. That rule is unchanged and it is a rule about a SCREEN,
   *  not about the layer — it forbids the two counts side by side, and the
   *  Premiership section has no Fantrax number on it at all. There, FPL's count
   *  of a Premier League goal simply is the Premier League's count.
   *
   *  So the bound travels with the field: **these may not appear on a fantasy
   *  screen beside a Fantrax figure.** `/prem` is theirs; `/players`,
   *  `/squad/[teamId]` and the matchup boards are not. */
  goals: number;
  assists: number;
  cleanSheets: number;
  minutes: number;
  /** Appearances from the start, which is not the same as appearances — a
   *  substitute has minutes and no start. */
  starts: number;
  expectedGoals: number;
  expectedAssists: number;
  expectedGoalsConceded: number;
  /** FPL's three indices. Influence and Creativity are Championship Manager's
   *  own words for the same two ideas, which is why the attribute grid can print
   *  them under their own names rather than under a paraphrase.
   *
   *  Season TOTALS, not rates — they accumulate with minutes, so anything
   *  comparing two players has to divide by ninety first. */
  influence: number;
  creativity: number;
  threat: number;
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
  /** FPL's season-stable fixture code, and the join to the Premier League's own
   *  API — their `altIds.opta` is `g` followed by this number. `id` is
   *  per-season and is what the app's own routes address; this is what crosses
   *  to another provider. */
  code: number;
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

/** The kinds of event this app has any use for.
 *
 *  Opta publishes twenty-six types and a round of ten matches carries about
 *  1,083 events; these seven are the ones that move a fantasy score or change
 *  who is on the pitch. Everything else — every corner, throw-in and free kick
 *  won — is dropped in the mapper rather than filtered by a caller, because a
 *  feed nobody could read is not a feed with a filter missing.
 *
 *  `disallowed-goal` is Opta's `VAR cancelled goal`, and it is a NARRATIVE line
 *  rather than a correction: checked across gameweeks 1-3, a cancelled goal is
 *  never also published as a `goal`, so counting goals from this feed reproduces
 *  every scoreline exactly (21 of 21) and nothing ever has to be un-printed. */
export type MatchEventKind =
  | "goal"
  | "penalty-goal"
  | "own-goal"
  | "disallowed-goal"
  | "yellow-card"
  | "red-card"
  | "substitution";

/** One thing that happened in a match, with the minute it happened in.
 *
 *  The Premier League's own feed, which is the only source of a goal's minute we
 *  have ever had — FPL publishes none, anywhere, and the sister repo's export
 *  runs about a day behind full time. */
export interface MatchEvent {
  /** The provider's id for this line. Stable across polls, so a list keys on it
   *  rather than on an index that shifts as events arrive. */
  id: number;
  /** FPL's season-stable fixture code, read off the provider's `altIds.opta`.
   *  The code and not the id, because this crossed a provider boundary. */
  fixtureCode: number;
  kind: MatchEventKind;
  /** The clock as the feed prints it — `"07"`, `"45+2"`, `"90+6"`. A string
   *  because stoppage time is not a number and rounding it to one would lose the
   *  only part anybody quotes. */
  minute: string;
  /** Seconds elapsed **in this fixture**, which is the orderable form of
   *  `minute`. `minute` is for reading; this is for sorting.
   *
   *  They are kept apart because the printed clock does not sort: `"90+2"` comes
   *  before `"9"` as a string and equals 90 as a number, and both are wrong.
   *
   *  **It orders one match and NOT a round.** It is elapsed time from this
   *  fixture's own kick-off, so a 12:30 match and a 17:30 one both start at 0 —
   *  a wire interleaving ten matches must order on
   *  `kickoff + seconds`, not on this alone.
   *
   *  **And the provider's own field is not monotonic even within a match.**
   *  Recorded: `end 1` carries 2910 and the second half's `start` carries 2700,
   *  going backwards across the interval. Every one of those period-boundary
   *  types is outside `MatchEventKind`, so the events this app keeps are safely
   *  ordered — but anything widening the kind list inherits the hazard. */
  seconds: number;
  /** The same instant as a wall clock — kick-off plus `seconds`, in epoch
   *  milliseconds — which is the only field that orders events ACROSS fixtures.
   *
   *  Null when the provider gave no kick-off time for the match, so a caller
   *  sorting a round drops it rather than sorting it to 1970. */
  absolute: number | null;
  /** Opta's own sentence, verbatim. Ours is the ownership beside it, never the
   *  prose: this is a wire we are reprinting, not a report we are writing. */
  text: string;
  /** FPL player CODES, and **positional by kind** — checked on every such event
   *  in gameweeks 1-3, with no exceptions:
   *
   *  | kind | `players` |
   *  |---|---|
   *  | `goal`, `penalty-goal` | `[scorer]` or `[scorer, assister]` |
   *  | `own-goal`, `disallowed-goal` | `[scorer]` |
   *  | `yellow-card`, `red-card` | `[booked]` |
   *  | `substitution` | `[on, off]` |
   *
   *  **Null holds the place of a man we could not resolve**, rather than the
   *  array closing up around him: the position IS the meaning here, and a
   *  compacted array would silently promote an assister to scorer. Counted 4 Sep
   *  2026 — 20 of the 360 players named across a round's events are absent from
   *  the `/players` collection, so this is a real case and not a defensive one. */
  players: (number | null)[];
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
  /** Whether he was in the eleven, as a COUNT for the round — a gameweek total
   *  like the four above it, so **never summed across one round's rows**.
   *  Counted before it was mapped: 653/653 non-null, and never a start against
   *  nought minutes (`fpl/map.ts` carries the probe). */
  starts: number;
  /** What FPL's own game paid him for THIS fixture, summed from the `explain`
   *  block that describes it.
   *
   *  **FPL's scoring and never ours.** It may not be printed in a column headed
   *  `FPts`, which is Fantrax's word for Fantrax's scoring of a slot we chose —
   *  `gameLog.ts` states the same bound about the same figure. It is here
   *  because it is the only per-fixture fantasy figure that exists for every
   *  player in every match: Fantrax publishes a period total for the men a
   *  manager started (6 of a fixture's 32, counted 4 Sep 2026) and a true
   *  per-match figure only through one rate-limited request per player. */
  fplPoints: number;
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
