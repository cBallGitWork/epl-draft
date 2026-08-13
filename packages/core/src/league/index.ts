// The league layer's public surface. Import from here, not from the Fantrax
// subfolder — that indirection is what lets our own 27/28 engine replace Fantrax
// as an adapter change rather than a rewrite.

export type {
  LeagueInfo,
  LeagueMatchup,
  LiveTeamScore,
  LeaguePeriod,
  LeaguePlayer,
  LeaguePlayerState,
  LeagueTeam,
  LeagueTransaction,
  PeriodRosters,
  RosterLimits,
  RosterSlot,
  StandingsRow,
  TeamRoster,
  TransactionKind,
  TransactionView,
} from "./types";

export { captureStaleness } from "./staleness";
export type { CaptureStaleness } from "./staleness";

export { periodGameweeks } from "./calendar";
export type { GameweekKickoff, PeriodGameweeks } from "./calendar";

export { rosterDisplay } from "./visibility";
export type { RosterDisplay, SquadReason } from "./visibility";

export { applyMove, eligibilityOf, eligibleSlots, legalMoves } from "./moves";
export type { Blocker, Eligibility, Move, SlotOption } from "./moves";

export { violations } from "./violations";
export type { Violation } from "./violations";

export { isActive } from "./rosterStatus";

export { leaguePool, periodPairings } from "./selectors";
export type { PeriodPairing, PoolPlayer } from "./selectors";

export {
  FantraxError,
  errorEnvelope,
  pageErrorEnvelope,
  responseErrorEnvelope,
} from "./fantrax/errors";
export type { ScoringRules } from "./scoring";
export { mapLiveScores } from "./fantrax/livescoring";
export { mapPlayerProfile } from "./fantrax/profile";
export type { LabelledValue, PlayerIntel } from "./fantrax/profile";
export { mapTransactions } from "./fantrax/transactions";
export type { RawTransactionHistory } from "./fantrax/transactions";
// Exported so the app can hold a raw payload across a cache boundary before
// mapping it — the mapper stays the only place raw meets clean.
export type { RawTeamRosters } from "./fantrax/raw";
export { fetchLiveScoring, fetchPlayerProfile, fetchTransactions } from "./fantrax/client";
export { mapLeagueInfo, mapPlayerPool, readingOrder } from "./fantrax/map";
export { mapTeamRosters } from "./fantrax/rosters";
export { mapStandings } from "./fantrax/standings";
export {
  fetchDraftResults,
  fetchLeagueInfo,
  fetchPlayerPool,
  fetchStandings,
  fetchTeamRosters,
} from "./fantrax/client";
