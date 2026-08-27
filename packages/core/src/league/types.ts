import type { ScoringCategory, ScoringRules } from "./scoring";

// The LEAGUE layer: our fantasy competition, sourced from Fantrax. Where the
// football layer is the real Premier League and is permanent, this layer is an
// adapter over whoever happens to be running our league — Fantrax now, our own
// engine in 27/28.
//
// Nothing here is football truth. Two consequences run through every type below:
//
//  1. A player's club code and position here are FANTRAX's opinion. The
//     commissioner can change a position at any time and Fantrax carries youth
//     players FPL has never heard of. Positions are display hints, never join
//     keys, and the club codes are not FPL's (they disagree on Brentford and
//     Nott'm Forest).
//  2. The join to the football layer goes through the identity bridge and
//     nothing else. Never name-match at runtime.

/** A player as Fantrax's global EPL pool knows them. */
export interface LeaguePlayer {
  fantraxId: string;
  /** Verbatim, as Fantrax gives it — usually "Surname, Firstname" but sometimes
   *  a display form ("Gabriel Jesus"). Kept unmodified so a bridge audit can see
   *  exactly what was matched against. */
  rawName: string;
  /** Reading order, comma form resolved. */
  displayName: string;
  /** Fantrax's three-letter club code, which is not always FPL's. */
  clubCode: string | null;
  /** Fantrax's position letter (G/D/M/F). Commissioner-mutable league state. */
  position: string | null;
  rotowireId: number | null;
}

/** Per-player state within OUR league, as distinct from the global pool: who is
 *  rostered, who is on waivers, and what the commissioner currently deems them
 *  eligible to play as. */
export interface LeaguePlayerState {
  fantraxId: string;
  /** Fantrax supports multi-position eligibility, so this is a list — "F,M" is a
   *  real and common value. Another reason position cannot be a join key. */
  eligiblePositions: string[];
  /** Fantrax's own code, e.g. "WW" for waiver wire. Left as a raw string: the
   *  vocabulary is theirs and undocumented, and inventing an enum would mean
   *  guessing at values we have not seen. */
  status: string;
}

/** The roster shape the league enforces, as configured by the commissioner. */
export interface RosterLimits {
  maxTotalPlayers: number;
  maxActivePlayers: number;
  maxReservePlayers: number;
  /** Position letter to maximum active count, e.g. `{ G: 1, D: 5, M: 5, F: 3 }`. */
  maxActiveByPosition: Record<string, number>;
}

/** One scoring or roster period. Fantrax numbers these 1–38 in step with FPL
 *  gameweeks, but the dates are its own and carry a US Eastern offset. */
export interface LeaguePeriod {
  number: number;
  /** ISO instants, as provided (offset preserved). */
  start: string;
  end: string;
}

/** A fantasy team in our league. */
export interface LeagueTeam {
  teamId: string;
  name: string;
}

/** One pairing in one period.
 *
 *  Ids, not embedded teams: Fantrax sends team names on `teamInfo` and again on
 *  every matchup, and a second copy is a copy that goes stale when someone renames
 *  their team. Flattened to one row per pairing per period so selecting a period
 *  is a filter. */
export interface LeagueMatchup {
  period: number;
  homeTeamId: string;
  awayTeamId: string;
}

/** What one squad has scored in one period, according to Fantrax.
 *
 *  Theirs, and that is the whole point: they run the competition, their scoring
 *  system is a commissioner setting, and the real league scores five categories
 *  FPL does not publish at all. We read this number and never compute one — an
 *  engine of our own could only have produced a systematically wrong total for
 *  defenders, midfielders and keepers, and would have had to say so on screen. */
export interface LiveTeamScore {
  teamId: string;
  /** Null when Fantrax did not give a total. Absence is not nought. */
  points: number | null;
  /** Active players whose fixture has not finished, or null when unknown. Names
   *  nobody, so it is publishable even while the lineup gate is closed. */
  toPlay: number | null;
}

/** What one player scored in one period, priced at the ROSTER SLOT his manager
 *  chose — the only per-player number that agrees with the team total beside it.
 *
 *  Fantrax's stat tables price the same man at his default position instead, and
 *  48 of the pool's 622 players are eligible at two. Because the deeper slot pays
 *  strictly more, an optimal lineup always files those men off their default, so
 *  the disagreement is the normal case for the players who matter rather than an
 *  edge one. */
export interface LivePlayerPoints {
  fantraxId: string;
  /** His total. Nought is a real nought; a man with no football behind him is
   *  absent from the list instead. */
  points: number;
  categories: LivePlayerCategory[];
}

/** One category's contribution, in Fantrax's own identifiers.
 *
 *  Unnamed on purpose: what these ids are called is a league setting, published
 *  by `getLeagueInfo`, and the two leagues answer different vocabularies. The
 *  adapter that reads the scoring system names them; this one only carries them.
 */
export interface LivePlayerCategory {
  /** `"{groupId}#{categoryId}"`. */
  category: string;
  /** The count behind the points — 90 minutes, 1 goal. Null when Fantrax sent
   *  no number for it. */
  value: number | null;
  /** Points, theirs. Signed: cards and goals against arrive negative. */
  points: number;
}

/** One squad's priced players for one period. Entries and not a Map: this
 *  crosses a cache boundary, and a Map does not survive serialisation. */
export interface LiveSquadPoints {
  teamId: string;
  players: LivePlayerPoints[];
}

/** One player in one team's roster for one period. */
export interface RosterSlot {
  fantraxId: string;
  /** The slot Fantrax has them filling. Fantrax's opinion, commissioner-mutable,
   *  and never a join key. */
  position: string | null;
  /** ACTIVE or RESERVE, raw. The distinction is the whole point of a lineup, so
   *  it is carried verbatim rather than reduced to a boolean we would have to
   *  reinterpret when Fantrax adds a third value. */
  status: string;
}

export interface TeamRoster {
  teamId: string;
  teamName: string;
  slots: RosterSlot[];
}

/** `getTeamRosters` for one period. */
export interface PeriodRosters {
  /** Which period this is, echoed back by Fantrax. Null when it did not say —
   *  never 0, which would read as a real period. */
  period: number | null;
  teams: TeamRoster[];
}

/** Which transaction log to read. These are Fantrax's own tab ids, and the legal
 *  set arrives in `displayedLists.tabs` on every response — server-driven, so a
 *  new tab appears in the data before it appears here (§3). */
export type TransactionView = "CLAIM_DROP" | "TRADE" | "LINEUP_CHANGE";

/** What happened. `unknown` is retained rather than dropped: a transaction we
 *  cannot classify still moved a player, and silently discarding it would leave
 *  a squad changing for no recorded reason. */
export type TransactionKind = "claim" | "drop" | "trade" | "lineup" | "unknown";

/** One player moving, once.
 *
 *  A trade is two of these sharing a `setId`, as is a claim and the drop that
 *  paid for it. Kept flat rather than nested per transaction because every view
 *  we render — a team's history, a player's history, the week's activity — wants
 *  to filter rows, and the grouping is recoverable from `setId` whenever it is
 *  actually needed. */
export interface LeagueTransaction {
  /** Groups the halves of one transaction. Empty when Fantrax omitted it. */
  setId: string;
  kind: TransactionKind;
  fantraxId: string;
  /** As Fantrax renders it here ("Kevin Schade") — reading order already, unlike
   *  the pool's "Schade, Kevin". Display only; the id is the join key. */
  playerName: string;
  /** Null where there is no team on that side: nobody owns a free agent, and a
   *  dropped player goes to the pool rather than to another manager. */
  fromTeamId: string | null;
  toTeamId: string | null;
  /** Fantrax's own string, verbatim and unparsed — "Wed Aug 12, 2026, 9:14AM".
   *  It carries no offset, so making an instant of it would mean assuming a
   *  timezone on data we do not control. */
  processedAt: string | null;
  /** The period the move takes effect in, not when it was made. */
  period: number | null;
  /** Fantrax distinguishes executed from pending, and the default filter hides
   *  the pending ones. Carried so a caller cannot mistake a proposal for a fact. */
  executed: boolean;
}

export interface StandingsRow {
  teamId: string;
  teamName: string;
  rank: number;
  /** Win-loss-tie exactly as Fantrax formats it ("0-0-0"). Unparsed on purpose:
   *  every sample we have is all zeroes, so splitting it would infer a format
   *  from nothing. Parse it when a played gameweek produces a real one. */
  record: string;
  pointsFor: number;
}

/** Everything `getLeagueInfo` tells us about the competition's configuration.
 *
 *  Nearly all of it is custom. FPL's rules are fixed for everyone and can be
 *  constants; a Fantrax league's rules are the product being sold, so the shape of
 *  the competition is data we read — roster limits, the position vocabulary, the
 *  period calendar, the lineup deadline, the team count, the schedule. Never
 *  assumed, never inferred from the football layer (§3). */
export interface LeagueInfo {
  name: string;
  seasonYear: number;
  /** Season bounds as plain YYYY-MM-DD dates, not instants. */
  startDate: string;
  endDate: string;
  /** Absent in the rehearsal league and present in the real one — same provider,
   *  same day. Null means Fantrax did not say. */
  draftType: string | null;
  roster: RosterLimits;
  scoringPeriods: LeaguePeriod[];
  /** The lineup calendar, which is not the scoring calendar.
   *
   *  Fantrax ships both and they are nearly — but not quite — the same: across
   *  all 38 periods the starts are identical and every end differs by one
   *  second. Near-identical is not identical, and they answer different
   *  questions: `scoringPeriods` says when points count, `rosterPeriods` says
   *  when a lineup is locked. The deadline is a commissioner setting, so the
   *  gate reads this one and never infers a lock from the scoring calendar. */
  rosterPeriods: LeaguePeriod[];
  players: LeaguePlayerState[];
  /** Empty until managers join. */
  teams: LeagueTeam[];
  matchups: LeagueMatchup[];
  /** What each category is worth. Null when Fantrax described no scoring.
   *
   *  Present so one view can preview the clean sheets their live feed withholds
   *  until full time; the scores themselves are always theirs. */
  scoring: ScoringRules | null;
  /** What each scoring category is called, keyed as `getLiveScoringStats` keys
   *  it — group and category, never the position. Empty when Fantrax described
   *  no scoring, which shows as no breakdown rather than as a row of ids. */
  scoringCategories: Record<string, ScoringCategory>;
  /** The season's own cut, as the commissioner set it.
   *
   *  Null for a league that runs no playoff, which is a table with no line to
   *  draw rather than one with the line at zero — and the rehearsal league is
   *  exactly that, so both answers are live today. */
  playoffs: LeaguePlayoffs | null;
}

export interface LeaguePlayoffs {
  /** How many places qualify. */
  places: number;
  /** The first period played as a playoff, and the last of the regular season.
   *  Periods, not gameweeks: this is the league's calendar, and the two are
   *  mapped rather than assumed to agree. */
  firstPeriod: number;
  lastRegularPeriod: number;
}
