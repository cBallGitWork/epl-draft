// The league layer's public surface. Import from here, not from the Fantrax
// subfolder — that indirection is what lets our own 27/28 engine replace Fantrax
// as an adapter change rather than a rewrite.

export type {
  LeagueInfo,
  LeagueMatchup,
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

export { applyMove, eligibilityOf, eligibleSlots, legalMoves, violations } from "./moves";
export type { Blocker, Eligibility, Move, SlotOption, Violation } from "./moves";

export { leaguePool } from "./selectors";
export type { PoolPlayer } from "./selectors";

export {
  FantraxError,
  errorEnvelope,
  pageErrorEnvelope,
  responseErrorEnvelope,
} from "./fantrax/errors";
export { mapTransactions } from "./fantrax/transactions";
export type { RawTransactionHistory } from "./fantrax/transactions";
export { fetchTransactions } from "./fantrax/client";
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
