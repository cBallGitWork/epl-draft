// The league layer's public surface: import from here, never the Fantrax subfolder, so the adapter can be replaced.

export type {
  LeagueInfo,
  LeaguePeriod,
  LeaguePlayer,
  LeaguePlayerState,
  LeagueTeam,
  LeagueTransaction,
  BlockPlayer,
  TradeBlock,
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
  TeamProjection,
} from "./points";

export type { PoolStatRow, StatSeason, TeamStats } from "./stats";

export {
  bandCategories,
  liveBreakdown,
} from "./breakdown";
export type { BreakdownLine, CategoryBand, CategoryMan } from "./breakdown";

export { captureStaleness } from "./staleness";

export { seasonForm } from "./form";
export type { FormGame } from "./form";
export { defaultDescending, isSortKey, sortRows } from "./standingsOrder";
export { linesAfter, tableLines } from "./tableLines";
export type { SortKey } from "./standingsOrder";

export { pedigreeOf } from "./pedigree";
export type { Pedigree } from "./pedigree";

export { firstKickoff, locksAt, openingGameweek, periodDays, periodFixtures, periodGameweeks, periodLock, periodOfGameweek, saveOpen } from "./calendar";
export type { GameweekKickoff, PeriodGameweeks } from "./calendar";

export { lastLockedPeriod, periodToRead, planningPeriod, rosterDisplay } from "./visibility";
export type { RosterDisplay, SquadReason } from "./visibility";

export { applyMove, eligibilityOf, legalMoves } from "./moves";
export type { Eligibility, Move } from "./moves";

export { violations } from "./violations";
export { formations } from "./formations";
export { leagueLimits, minimumsOf } from "./minimums";
export { derbyBrief, derbyNames, derbyOf } from "./derbies";
export type { Derby, DerbyName } from "./derbies";
export type { Violation } from "./violations";

export { isActive } from "./rosterStatus";
export { recordedRole } from "./recorded";
export { fetchSeasonCodes } from "./fantrax/playerClient";

// The shape differ, for `scripts/shape-diff.ts`: does the league still answer in the shape the mappers expect.
export { diffShapes, shapeOf } from "./fantrax/shape";

export { headToHead, leaguePool, leagueSeason, nextPairedPeriod, pairingInvolves, periodPairings, scoringOf } from "./selectors";
export { leads, trails } from "./scoreline";
export type { LeagueSeason, PeriodPairing, PoolPlayer } from "./selectors";

export { LEAGUE_COMPETITION, cupTies, groupTies, leagueTies, seededIn } from "./competitions";
export type { CompetitionTie, TieSide } from "./competitions";
export { CUPS } from "./cups/declared";
export type { Cup, GroupStage } from "./cups/declared";
export { groupTable } from "./cups/groupTable";
export { cupGroups, cupPlan } from "./cups/plan";
export type { CupStage } from "./cups/plan";

export { FantraxError } from "./fantrax/errors";
export { categoryPoints, returnPoints } from "./scoring";
export type { ScoringCategory, ScoringRules } from "./scoring";
export { orphaned, unacknowledged } from "./fantrax/baseline";
export type { AcknowledgedDifference } from "./fantrax/baseline";
export { pointsFor } from "./scoring";
export type { LeagueScoring } from "./scoring";
export { rulesCard, scoredSlots } from "./rulesCard";
export {
  mapBenchPlayerPoints,
  mapLivePlayerPoints,
  mapLiveScores,
  mapProjectedTotals,
} from "./fantrax/livescoring";
export { mapPoolStats, mapTeamStats } from "./fantrax/stats";
export { numeric } from "./fantrax/stats";
export { mapStatSheet } from "./fantrax/statSheet";
export type { StatSheet } from "./fantrax/statSheet";
export { mapBenchOrder } from "./fantrax/benchOrder";
export type { RawTeamRosterInfo } from "./fantrax/benchOrder";
export { isFantraxPlayerId, mapPlayerProfile } from "./fantrax/profile";
export type { PlayerIntel, PlayerMatch } from "./fantrax/profile";
export { mapTransactions, orderKey } from "./fantrax/transactions";
export { mapPositionNames, mapTradeBlocks } from "./fantrax/tradeBlock";
export { fetchPendingTrades, fetchPositionRefs, fetchTradeBlocks } from "./fantrax/tradeClient";
export { mapPendingTrades } from "./fantrax/pendingTrades";
export type { ProposedMove, TradeProposal } from "./proposals";
// Everything written about one player.
export { fetchPlayerProfile, fetchPlayerStories, fetchPoolNews, fetchPoolStats } from "./fantrax/playerClient";
export { mapPlayerStories, mapPoolNews } from "./fantrax/playerNews";
export type { PlayerStory } from "./fantrax/playerNews";
// So the app can cache a raw payload before mapping it; the mapper stays the only place raw meets clean.
export type { RawTeamRosters } from "./fantrax/raw";
export {
  fetchLiveScoring,
  fetchLiveScoringDay,
  fetchTeamRosterInfo,
  fetchTeamStats,
  fetchTransactions,
} from "./fantrax/client";
export { mapLeagueInfo, mapPlayerPool } from "./fantrax/map";
export { fetchLineupState, sendBenchOrder, sendLineup } from "./fantrax/lineupClient";
export {
  benchToWrite,
  changesLineup,
  fieldMapFor,
  lineupChanges,
  mapLineupState,
  readBenchAnswer,
  readLineupAnswer,
  stillHeld,
} from "./fantrax/lineupWrite";
export type { WriteAnswer } from "./fantrax/lineupWrite";
export { mapTeamRosters } from "./fantrax/rosters";
export { mapDraftPicks } from "./fantrax/draft";
export type { DraftPick } from "./fantrax/draft";
export { mapStandings } from "./fantrax/standings";
export { mapSeasonResults } from "./fantrax/results";
export type { PeriodResult } from "./fantrax/results";
export { mapSeasonStats } from "./fantrax/seasonStats";
export { GROUPS, categoryFor, groupFor, isMeasure, offeredIn, statCategory } from "./categories";
export {
  ASSIST,
  ASSISTS_FANTASY,
  ASSISTS_OFFICIAL,
  ASSISTS_TOTAL,
  CLEAN_SHEETS,
  DEFCON,
  GOALS,
  GOALS_AGAINST,
  GOALS_AGAINST_OUTFIELD,
  KEEPER_POINTS,
  KEEPER_WORK,
  MINUTES,
  OWN_GOALS,
  PENALTIES_MISSED,
  PENALTY_SAVES,
  RED_CARDS,
  SAVES,
  YELLOW_CARDS,
  carries,
  firstScored,
  idsOf,
} from "./categoryNames";
export type { FantraxCategory } from "./categoryNames";
export { wordsFor, wordsOf } from "./categoryWords";
export { bestDefConPoints, defConAt, defConScored } from "./defcon";
export type { DefConPeriod } from "./defcon";
export type { GroupKey, Measure, StatCategory } from "./categories";
export { mapPlayerStats, KEEPER, OUTFIELD } from "./fantrax/playerStats";
export { mapAssistKinds } from "./fantrax/assistKinds";
export { fetchPoolWindow } from "./fantrax/windowClient";
export type { PlayerStatLine, RawPlayerStats } from "./fantrax/playerStats";
export { PLAYER_CATEGORIES } from "./playerCategories";
export { ordinal, printedPlaces } from "./ordinal";
export { signed } from "./signed";
export { coloursOf, type TeamColours } from "./teamColours";
export { rankBy } from "./categoryBoard";
export type { CategoryLine } from "./fantrax/seasonStats";
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
