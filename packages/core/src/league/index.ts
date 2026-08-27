// The league layer's public surface. Import from here, not from the Fantrax
// subfolder — that indirection is what lets our own 27/28 engine replace Fantrax
// as an adapter change rather than a rewrite.

export type {
  LeagueInfo,
  LivePlayerCategory,
  LivePlayerPoints,
  LiveTeamScore,
  LeaguePeriod,
  LeaguePlayoffs,
  LeaguePlayer,
  LeaguePlayerState,
  LeagueTeam,
  LeagueTransaction,
  PeriodRosters,
  RosterLimits,
  RosterSlot,
  StandingsRow,
  TransactionView,
} from "./types";

export type { PoolStatRow, StatColumn, StatSeason, TeamStats } from "./stats";

export { breakdownOf, liveBreakdown } from "./breakdown";
export type { BreakdownLine } from "./breakdown";

export { captureStaleness } from "./staleness";

export { firstKickoff, locksAt, periodGameweeks } from "./calendar";
export type { GameweekKickoff } from "./calendar";

export { rosterDisplay } from "./visibility";
export type { RosterDisplay, SquadReason } from "./visibility";

export { applyMove, eligibilityOf, eligibleSlots, legalMoves } from "./moves";
export type { Blocker, Eligibility, Move, SlotOption } from "./moves";

export { violations } from "./violations";
export type { Violation } from "./violations";

export { isActive } from "./rosterStatus";

// The shape differ, for the script that asks whether the real league answers in
// the shape every mapper here was written against. Its one consumer is
// `scripts/shape-diff.ts`, which is the 11:00 item on the ship-day runbook.
export { diffShapes, shapeOf } from "./fantrax/shape";
export type { ShapeDiff } from "./fantrax/shape";

export { headToHead, leaguePool, pairingInvolves, periodPairings } from "./selectors";
export { leads, trails } from "./scoreline";
export type { HeadToHead, PeriodPairing, PoolPlayer } from "./selectors";

export {
  COMPETITIONS,
  LEAGUE_COMPETITION,
  PLACEHOLDER_ROUNDS,
  groupTies,
  leagueTies,
  seededTies,
} from "./competitions";
// `Competition`, `CompetitionGroup` and `SeededRound` stay off the surface
// deliberately: all three are inferred at every call site, and §2 does not keep
// an export nothing imports.
export type { CompetitionTie, TieSide } from "./competitions";

export { FantraxError } from "./fantrax/errors";
export type { ScoringCategory, ScoringRules } from "./scoring";
export { mapLivePlayerPoints, mapLiveScores } from "./fantrax/livescoring";
export { mapPoolStats, mapTeamStats } from "./fantrax/stats";
export { mapPlayerProfile } from "./fantrax/profile";
export type { LabelledValue, PlayerIntel } from "./fantrax/profile";
export { mapTransactions, transactionDateLabel } from "./fantrax/transactions";
// Exported so the app can hold a raw payload across a cache boundary before
// mapping it — the mapper stays the only place raw meets clean.
export type { RawTeamRosters } from "./fantrax/raw";
export {
  fetchLiveScoring,
  fetchPlayerProfile,
  fetchPoolStats,
  fetchTeamStats,
  fetchTransactions,
} from "./fantrax/client";
export { mapLeagueInfo, mapPlayerPool } from "./fantrax/map";
export { mapTeamRosters } from "./fantrax/rosters";
export { mapStandings } from "./fantrax/standings";
export { mapTeamBadges } from "./fantrax/badges";
export type { TeamBadge } from "./fantrax/badges";
export { mapSeasonResults } from "./fantrax/results";
export type { PeriodResult } from "./fantrax/results";
export {
  fetchDraftResults,
  fetchLeagueInfo,
  fetchPlayerPool,
  fetchSeasonResults,
  fetchStandings,
  fetchTeamBadges,
  fetchTeamRosters,
} from "./fantrax/client";
