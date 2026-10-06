import type { ScoringCategory, ScoringRules } from "./scoring";

// The league layer's types, from Fantrax: positions and club codes are Fantrax's opinion and never join keys.
// The join to the football layer is the identity bridge alone; never name-match at runtime.

/** A player as Fantrax's global EPL pool knows them. */
export interface LeaguePlayer {
  fantraxId: string;
  /** Verbatim, usually "Surname, Firstname", kept so a bridge audit sees what was matched. */
  rawName: string;
  /** Reading order, comma form resolved. */
  displayName: string;
  /** Fantrax's three-letter club code, which is not always FPL's. */
  clubCode: string | null;
  /** Fantrax's position letter (G/D/M/F). Commissioner-mutable league state. */
  position: string | null;
  rotowireId: number | null;
}

/** Per-player state within our league: rostered or on waivers, and where he is eligible. */
export interface LeaguePlayerState {
  fantraxId: string;
  /** A list, since "F,M" is a real and common value. */
  eligiblePositions: string[];
  /** Fantrax's own undocumented code, e.g. "WW" for waiver wire; raw, never an enum. */
  status: string;
}

/** The roster shape the league enforces, as configured by the commissioner. */
export interface RosterLimits {
  /** Null where the league has not published a cap, and never zero. */
  maxTotalPlayers: number | null;
  maxActivePlayers: number | null;
  maxReservePlayers: number | null;
  /** Position letter to maximum active count, e.g. `{ G: 1, D: 5, M: 5, F: 3 }`. */
  maxActiveByPosition: Record<string, number>;
  /** Position letter to the fewest that may start there, e.g. `{ D: 3, M: 2 }`.
   *  Always empty from `getLeagueInfo`: it arrives from a checked-in file a script generates.
   *  An absent position means "not told", which is a different claim from a minimum of nought. */
  minActiveByPosition: Record<string, number>;
}

/** One scoring or roster period: numbered 1–38 with FPL gameweeks, its dates Fantrax's own in US Eastern. */
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

/** One pairing in one period, by team id so a renamed team cannot go stale here. */
export interface LeagueMatchup {
  period: number;
  homeTeamId: string;
  awayTeamId: string;
}

/** One player in one team's roster for one period. */
export interface RosterSlot {
  fantraxId: string;
  /** The slot Fantrax has him filling; commissioner-mutable and never a join key. */
  position: string | null;
  /** ACTIVE or RESERVE, raw, so a third value from Fantrax is not misread as a boolean. */
  status: string;
}

export interface TeamRoster {
  teamId: string;
  teamName: string;
  slots: RosterSlot[];
}

/** `getTeamRosters` for one period. */
export interface PeriodRosters {
  /** The period Fantrax echoed back; null when it did not say, never 0. */
  period: number | null;
  teams: TeamRoster[];
}

/** Fantrax's own transaction tab ids; the legal set arrives in `displayedLists.tabs` on every response. */
export type TransactionView = "CLAIM_DROP" | "TRADE" | "LINEUP_CHANGE";

/** What happened; `unknown` is kept because an unclassified move still moved a player. */
export type TransactionKind = "claim" | "drop" | "trade" | "lineup" | "unknown";

/** One player moving, once: a trade, or a claim and its drop, is several rows sharing a `setId`. */
export interface LeagueTransaction {
  /** Groups the halves of one transaction. Empty when Fantrax omitted it. */
  setId: string;
  kind: TransactionKind;
  fantraxId: string;
  /** Reading order as Fantrax renders it here ("Kevin Schade"); display only. */
  playerName: string;
  /** Fantrax's position letters ("D", "F,M"); display only, null when the row carried none. */
  position: string | null;
  /** His real club's short name as Fantrax spells it ("ARS"); display only, null when absent. */
  club: string | null;
  /** His club in full, "Sunderland"; null when the row carried none. */
  clubName: string | null;
  /** How a claim was made; null on a drop, a trade, or a claim Fantrax did not type. */
  via: "waivers" | "free agency" | null;
  /** Null where there is no team on that side: a free agent's origin, a dropped man's destination. */
  fromTeamId: string | null;
  toTeamId: string | null;
  /** Fantrax's own string, verbatim: "Wed Aug 12, 2026, 9:14AM", US Eastern with no offset in it. */
  processedAt: string | null;
  /** The period the move takes effect in, not when it was made. */
  period: number | null;
  /** False for a pending proposal, which Fantrax's default filter hides. */
  executed: boolean;
}

export interface StandingsRow {
  teamId: string;
  teamName: string;
  /** The place, by the league's rule: points, then fantasy points for, then name where both are
   *  level (`placeTable`). Fantrax's own rank shuffles teams level on both between reads. */
  rank: number;
  /** The record in Fantrax's own order: Win, Draw, Loss. */
  won: number;
  drawn: number;
  lost: number;
  /** `won + drawn + lost`, ours: Fantrax's table has no played column. */
  played: number;
  /** The league's points, read off Fantrax's table and never computed: a win's worth is a commissioner setting. */
  points: number;
  /** Fantasy points scored, Fantrax's FPtsF: the first tiebreak, not the order. */
  pointsFor: number;
  /** Fantasy points conceded, Fantrax's FPtsA: in head-to-head, the measure of a side's luck in the draw. */
  pointsAgainst: number;
}

/** The competition's configuration from `getLeagueInfo`: custom rules are data read here, never assumed. */
export interface LeagueInfo {
  name: string;
  seasonYear: number;
  /** Season bounds as plain YYYY-MM-DD dates, not instants. */
  startDate: string;
  endDate: string;
  /** Present in some leagues and absent in others; null means Fantrax did not say. */
  draftType: string | null;
  roster: RosterLimits;
  scoringPeriods: LeaguePeriod[];
  /** The lineup calendar, which is not the scoring calendar: every end differs by a second.
   *  The lineup lock reads this one and never the scoring calendar. */
  rosterPeriods: LeaguePeriod[];
  players: LeaguePlayerState[];
  /** Empty until managers join. */
  teams: LeagueTeam[];
  matchups: LeagueMatchup[];
  /** What each category is worth, to preview clean sheets Fantrax withholds until full time; null when undescribed. */
  scoring: ScoringRules | null;
  /** Each scoring category's name, keyed as `getLiveScoringStats` keys it (group and category, never position). */
  scoringCategories: Record<string, ScoringCategory>;
  /** The season's cut as the commissioner set it; null for a league with no playoff, never a line at zero. */
  playoffs: LeaguePlayoffs | null;
}

export interface LeaguePlayoffs {
  /** How many places qualify: the table's cut line. Fantrax's playoff period numbers are not carried. */
  places: number;
}
