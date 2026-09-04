// The league layer's public surface. Import from here, not from the Fantrax
// subfolder — that indirection is what lets our own 27/28 engine replace Fantrax
// as an adapter change rather than a rewrite.

export type {
  LeagueInfo,
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

export type {
  LivePlayerCategory,
  LivePlayerPoints,
  LiveSquadPoints,
  LiveTeamScore,
  PlayerProjection,
  SquadProjection,
  TeamProjection,
} from "./points";

export type { PoolStatRow, StatColumn, StatSeason, TeamStats } from "./stats";

export { breakdownOf, columnLabel, liveBreakdown } from "./breakdown";
export type { BreakdownLine } from "./breakdown";

export { captureStaleness } from "./staleness";

export { seasonForm } from "./form";
export type { FormGame, TeamForm } from "./form";
export { defaultDescending, isSortKey, sortRows } from "./standingsOrder";
export type { SortKey } from "./standingsOrder";

export { pedigreeOf } from "./pedigree";
export type { Pedigree } from "./pedigree";

export { firstKickoff, locksAt, periodGameweeks } from "./calendar";
export type { GameweekKickoff } from "./calendar";

export { lastLockedPeriod, periodToRead, planningPeriod, rosterDisplay } from "./visibility";
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
export { unacknowledged } from "./fantrax/baseline";
export type { AcknowledgedDifference } from "./fantrax/baseline";
export {
  mapLivePlayerPoints,
  mapLiveScores,
  mapProjectedPlayerPoints,
  mapProjectedTotals,
} from "./fantrax/livescoring";
export { mapPoolStats, mapTeamStats } from "./fantrax/stats";
export { mapPlayerProfile } from "./fantrax/profile";
export type { LabelledValue, PlayerIntel, PlayerMatch } from "./fantrax/profile";
export { mapTransactions, transactionDateLabel } from "./fantrax/transactions";
// The pool's news, read whole once — `playerNews.ts` says why it is not per-player.
export { fetchPlayerNews } from "./fantrax/client";
export { mapPlayerNews } from "./fantrax/playerNews";
export type { PlayerStory } from "./fantrax/playerNews";
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
export { mapDraftPicks } from "./fantrax/draft";
export type { DraftPick } from "./fantrax/draft";
export { mapStandings } from "./fantrax/standings";
export { mapTeamBadges } from "./fantrax/badges";
export type { TeamBadge } from "./fantrax/badges";
export { mapSeasonResults } from "./fantrax/results";
export type { PeriodResult } from "./fantrax/results";
export { mapSeasonStats } from "./fantrax/seasonStats";
export { GROUPS, categoryFor, groupFor, inGroup, isMeasure } from "./categories";
export type { GroupKey, Measure, StatCategory } from "./categories";
export { mapPlayerStats, KEEPER, OUTFIELD } from "./fantrax/playerStats";
export type { PlayerStatLine, PositionGroup, RawPlayerStats } from "./fantrax/playerStats";
export { PLAYER_CATEGORIES, playerCategoryFor, playersInGroup } from "./playerCategories";
export type { PlayerCategory } from "./playerCategories";
export { BOARD_ROWS, rankPlayers } from "./playerBoard";
export type { PlayerBoardRow } from "./playerBoard";
export { ordinal } from "./ordinal";
export { signed } from "./signed";
export { teamColours } from "./teamColours";
export type { TeamColours } from "./teamColours";
export { rankBy } from "./categoryBoard";
export type { BoardRow } from "./categoryBoard";
export type { CategoryLine, RawSeasonStats } from "./fantrax/seasonStats";
export {
  fetchDraftResults,
  fetchLeagueInfo,
  fetchPlayerPool,
  fetchSeasonResults,
  fetchSeasonStats,
  fetchStandings,
  fetchStandingsPage,
  fetchTeamRosters,
} from "./fantrax/client";
