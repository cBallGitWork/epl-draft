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
  TeamProjection,
} from "./points";

export type { PoolStatRow, StatColumn, StatSeason, TeamStats } from "./stats";

export {
  bandCategories,
  breakdownOf,
  columnLabel,
  liveBreakdown,
} from "./breakdown";
export type { BreakdownLine, CategoryBand, CategoryMan } from "./breakdown";

export { captureStaleness } from "./staleness";

export { seasonForm } from "./form";
export type { FormGame, TeamForm } from "./form";
export { defaultDescending, isSortKey, sortRows } from "./standingsOrder";
export type { SortKey } from "./standingsOrder";

export { pedigreeOf } from "./pedigree";
export type { Pedigree } from "./pedigree";

export { firstKickoff, locksAt, openingGameweek, periodDays, periodGameweeks, saveOpen } from "./calendar";
export type { GameweekKickoff } from "./calendar";

export { lastLockedPeriod, periodToRead, planningPeriod, rosterDisplay } from "./visibility";
export type { RosterDisplay, SquadReason } from "./visibility";

export { applyMove, eligibilityOf, eligibleSlots, legalMoves } from "./moves";
export type { Blocker, Eligibility, Move, SlotOption } from "./moves";

export { violations } from "./violations";
export { formations } from "./formations";
export { minimumsOf } from "./minimums";
export type { Violation } from "./violations";

export { isActive } from "./rosterStatus";

// The shape differ, for the script that asks whether the real league answers in
// the shape every mapper here was written against. Its one consumer is
// `scripts/shape-diff.ts`, which is the 11:00 item on the ship-day runbook.
export { diffShapes, shapeOf } from "./fantrax/shape";
export type { ShapeDiff } from "./fantrax/shape";

export { headToHead, leaguePool, pairingInvolves, periodPairings, scoringOf } from "./selectors";
export { leads, trails } from "./scoreline";
export type { HeadToHead, PeriodPairing, PoolPlayer } from "./selectors";

export { COMPETITIONS, LEAGUE_COMPETITION, cupTies, groupTies, leagueTies, seededIn } from "./competitions";
export type { CompetitionTie, TieSide } from "./competitions";
export { CUPS } from "./cups/declared";
export type { Cup, GroupStage } from "./cups/declared";
export { groupTable } from "./cups/groupTable";
export type { GroupRow } from "./cups/groupTable";
export { cupGroups, cupPlan } from "./cups/plan";
export type { CupFixture, CupStage } from "./cups/plan";

export { FantraxError } from "./fantrax/errors";
export { categoryPoints, returnPoints } from "./scoring";
export type { ScoringCategory, ScoringRules } from "./scoring";
export { orphaned, unacknowledged } from "./fantrax/baseline";
export type { AcknowledgedDifference } from "./fantrax/baseline";
export { pointsFor } from "./scoring";
export type { LeagueScoring } from "./scoring";
export {
  mapBenchPlayerPoints,
  mapLivePlayerPoints,
  mapLiveScores,
  mapProjectedTotals,
} from "./fantrax/livescoring";
export { mapPoolStats, mapTeamStats } from "./fantrax/stats";
export { mapStatSheet } from "./fantrax/statSheet";
export type { SheetColumn, SheetLine, StatSheet } from "./fantrax/statSheet";
export { mapBenchOrder } from "./fantrax/benchOrder";
export { isFantraxPlayerId, mapPlayerProfile } from "./fantrax/profile";
export type { LabelledValue, PlayerIntel, PlayerMatch } from "./fantrax/profile";
export { mapTransactions, orderKey, transactionDateLabel } from "./fantrax/transactions";
// Everything written about one player. `playerNews.ts` records the `tab`
// parameter that reaches it, and the eleven names that did not.
export { fetchPlayerStories, fetchPoolNews } from "./fantrax/client";
export { mapPlayerStories, mapPoolNews } from "./fantrax/playerNews";
export type { PlayerStory } from "./fantrax/playerNews";
// Exported so the app can hold a raw payload across a cache boundary before
// mapping it — the mapper stays the only place raw meets clean.
export type { RawTeamRosters } from "./fantrax/raw";
export {
  fetchLiveScoring,
  fetchLiveScoringDay,
  fetchTeamRosterInfo,
  fetchPlayerProfile,
  fetchPoolStats,
  fetchTeamStats,
  fetchTransactions,
} from "./fantrax/client";
export { listName, mapLeagueInfo, mapPlayerPool } from "./fantrax/map";
export { fetchLineupState, sendBenchOrder, sendLineup } from "./fantrax/lineupClient";
export {
  benchOrderMap,
  changesBenchOrder,
  changesLineup,
  fieldMapFor,
  mapLineupState,
  readBenchAnswer,
  readLineupAnswer,
} from "./fantrax/lineupWrite";
export type { FieldMap, LineupState, PlanRefusal, WriteAnswer } from "./fantrax/lineupWrite";
export { mapTeamRosters } from "./fantrax/rosters";
export { mapDraftPicks } from "./fantrax/draft";
export type { DraftPick } from "./fantrax/draft";
export { mapStandings } from "./fantrax/standings";
export { mapTeamBadges } from "./fantrax/badges";
export type { TeamBadge } from "./fantrax/badges";
export { mapSeasonResults } from "./fantrax/results";
export type { PeriodResult } from "./fantrax/results";
export { mapSeasonStats } from "./fantrax/seasonStats";
export { GROUPS, categoryFor, groupFor, isMeasure, offeredIn } from "./categories";
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
export type { CategoryWords } from "./categoryWords";
export { defConAt, defConPoints, defConScored } from "./defcon";
export type { DefConPeriod } from "./defcon";
export type { GroupKey, Measure, StatCategory } from "./categories";
export { mapPlayerStats, KEEPER, OUTFIELD } from "./fantrax/playerStats";
export { mapAssistKinds } from "./fantrax/assistKinds";
export { fetchPoolWindow } from "./fantrax/windowClient";
export type { PlayerStatLine, PositionGroup, RawPlayerStats } from "./fantrax/playerStats";
export { PLAYER_CATEGORIES } from "./playerCategories";
export type { PlayerCategory } from "./playerCategories";
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
export { MINUTES } from "./categoryNames";
