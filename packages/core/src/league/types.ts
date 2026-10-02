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
  /** **Null where the league has not published a cap**, and never zero.
   *
   *  `mapLeagueInfo` folded an absent limit to `0` with `?? 0`, which made every
   *  squad of any size break a rule the commissioner had never stated — a
   *  fifteen-man roster reported as three violations against caps of nought.
   *  Absence is not zero, which CODE_RULES states as a rule and DESIGN states
   *  again for the screen; this is the type saying it too, so a caller cannot
   *  compare against a limit without deciding what to do when there is none. */
  maxTotalPlayers: number | null;
  maxActivePlayers: number | null;
  maxReservePlayers: number | null;
  /** Position letter to maximum active count, e.g. `{ G: 1, D: 5, M: 5, F: 3 }`. */
  maxActiveByPosition: Record<string, number>;
  /** Position letter to the FEWEST that may start there, e.g. `{ D: 3, M: 2 }`.
   *
   *  **Empty from `getLeagueInfo`, and that is the provider and not a default.**
   *  `rosterInfo.positionConstraints` carries `maxActive` and nothing else — 0
   *  matches for `minActive` across all three leagues, live and in every
   *  snapshot — while Fantrax's commissioner setup page has a Min Active column
   *  that is switched ON for our league (D 3 · M 2 · F 1 · G 1). So the fact is
   *  real, is enforced by Fantrax, and reaches us only through a checked-in file
   *  a script generates. PLATFORM_NOTES carries the probe.
   *
   *  A position absent from the map has no published minimum, which is not a
   *  minimum of nought in any way that matters — nothing can go below nought —
   *  but the distinction is kept because "we were not told" and "the
   *  commissioner said none" are different claims. */
  minActiveByPosition: Record<string, number>;
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
  /** Fantrax's position letters for him, as they spell them here — "D", and
   *  "F,M" for a man eligible at two. Their opinion and commissioner-mutable,
   *  like every other position in this layer, so it is display only and never a
   *  join key. Null when the row carried none. */
  position: string | null;
  /** His real club's short name, as Fantrax spells it here — "ARS". Their
   *  opinion of it, like the position beside it, and display only. Null when the
   *  row carried none. */
  club: string | null;
  /** His club in full, "Sunderland"; null when the row carried none. */
  clubName: string | null;
  /** How a claim was made; null on a drop, a trade, or a claim Fantrax did not type. */
  via: "waivers" | "free agency" | null;
  /** Null where there is no team on that side: nobody owns a free agent, and a
   *  dropped player goes to the pool rather than to another manager. */
  fromTeamId: string | null;
  toTeamId: string | null;
  /** Fantrax's own string, verbatim: "Wed Aug 12, 2026, 9:14AM", US Eastern with no offset in it. */
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
  /** The place, by the league's rule: points, then fantasy points for, then name where both are
   *  level (`placeTable`). Fantrax's own rank shuffles teams level on both between reads. */
  rank: number;
  /** The record, in three columns rather than the one string the fxea read
   *  squashes it into — and in Fantrax's own order, which their header names
   *  Win, Draw, Loss. Football's order, not the win-loss-tie an American
   *  product's table is usually read in; the app called it W-L-T for as long as
   *  every sample was "0-0-0" and nothing could tell the two apart. */
  won: number;
  drawn: number;
  lost: number;
  /** Matches played, and the one column here that is OURS.
   *
   *  Fantrax's table has no such column — their header publishes `win`, `draw`,
   *  `loss`, `points`, `winpc`, `wwOrder`, `pointsFor`, `pointsAgainst` and
   *  `streak`, and nothing else. This is `won + drawn + lost`, which is a
   *  tautology about their own three numbers rather than a rule of the
   *  competition, and that is the whole test for what we may compute: what a win
   *  is WORTH is a commissioner setting and is read (see `points`); how many
   *  games a record adds up to is arithmetic. */
  played: number;
  /** The league's points — three for a win here. Read off Fantrax's table and
   *  never computed from the record: what a win is worth is a commissioner
   *  setting (§3), and a league that pays two would get three from us. */
  points: number;
  /** Fantasy points scored — Fantrax's FPtsF, and the table's `For`. The first
   *  tiebreak, not the column the table is ordered by, and the two are one
   *  number apart on a Saturday. */
  pointsFor: number;
  /** Fantasy points conceded — Fantrax's FPtsA, and the table's `Ag`.
   *
   *  In a head-to-head league this is a real column and not a curiosity: it is
   *  the whole of your luck. Two sides on the same points-for can be four places
   *  apart on who they happened to be drawn against, and `Ag` is where that
   *  shows. */
  pointsAgainst: number;
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
  /** How many places qualify — the table's cut line, and the only thing anything
   *  reads. `firstPlayoffPeriod` and `lastRegularSeasonPeriod` are on the wire
   *  and deliberately not carried: nothing draws a playoff calendar yet, and
   *  requiring them here made two unread numbers able to veto the one number
   *  that is read. Later can add them. */
  places: number;
}
