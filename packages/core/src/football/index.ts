// The football layer's public surface: import from here, never a provider subfolder, so a provider can change unnoticed.

export type {
  Club,
  Fixture,
  FixtureStatus,
  FootballPlayer,
  SeasonTotals,
  FootballSnapshot,
  PlayerMatchStats,
  MatchEvent,
  MatchEventKind,
} from "./types";

export { clubColours, clubColoursOf, clubGround, crestForShortName, crestUrl, inkOn, plateOn, shirtUrl } from "./clubs";
export type { ClubColours } from "./clubs";
// The photograph behind a club's own screens, and the credit it must carry.
export { clubGroundPhoto, groundPhotoCredits } from "./grounds";
export type { PhotoCredit } from "./grounds";
export { initials, portraitUrl } from "./portraits";
export { getFootballSnapshot } from "./snapshot";
// The whole-season fixture list and the raw bootstrap, which scripts want and `getFootballSnapshot` does not serve.
export { fetchBootstrap, fetchFixtures, fetchRegions } from "./fpl/client";
// One round's live feed and its per-fixture mapper, for a match screen on an older round.
export { fetchLive } from "./fpl/client";
export { mapLiveStats, roundPlayed } from "./fpl/map";
// The Premier League's own feed: goal minutes, match clock, team sheets, substitutions. Server-side only (CORS).
// Joins on `Fixture.code` against their `altIds.opta`, and FPL's `opta_code` against a player's.
export {
  fetchPlFixture,
  fetchPlMatchStats,
  fetchPlPlayerMatchStats,
  fetchPlStaff,
  fetchPlTeamStats,
  fetchPlTeams,
  fetchPlRound,
  fetchPlTextstream,
} from "./premierleague/client";
export {
  mapMatchEvents,
  mapRoundGoals,
  plFixtureCode,
  plCommentary,
  worthReading,
} from "./premierleague/map";
export type { PlCommentaryLine } from "./premierleague/map";
export { plPlayerCodes, plTeamSheets } from "./premierleague/teamSheet";
export type { PlSquadMan, PlTeamSheet } from "./premierleague/teamSheet";
export { plManMatches, plSubstitutions } from "./premierleague/sheetEvents";
export type { PlManMatch, PlSubstitution } from "./premierleague/sheetEvents";
export { goalGroups, plGoals } from "./premierleague/goals";
export type { PlGoal, PlGoalGroup } from "./premierleague/goals";
export { streamCredits } from "./premierleague/assists";
export { creditSide } from "./premierleague/assistKinds";
export type { AssistKinds } from "./premierleague/assistKinds";
export { creditRoundAssists, streamRedCards } from "./premierleague/wire";
export type { FixtureStream } from "./premierleague/wire";
export { injuryMinutes, saysInjury } from "./premierleague/injuries";
export type { StreamCredit } from "./premierleague/assists";
export { fetchHighlightsFeed } from "./highlightsClient";
export { highlightFor, parseHighlightFeed } from "./highlights";
export type { HighlightVideo } from "./highlights";
export { plMatchBoard } from "./premierleague/matchStats";
export { plMatchParts, plPlayerId, sumParts } from "./premierleague/playerMatch";
export type { MatchParts } from "./premierleague/playerMatch";
export type { MatchStatRow } from "./premierleague/matchStats";
export { mapRoundBreaks } from "./premierleague/breaks";
export { plMatchFacts } from "./premierleague/matchFacts";
export { plMoments } from "./premierleague/moments";
export { plManager } from "./premierleague/staff";
export { proseSpans, shortProse } from "./premierleague/prose";
export type { PlMatchFacts } from "./premierleague/matchFacts";
export type { RoundBreak } from "./premierleague/breaks";
export type {
  RawPlFixture,
} from "./premierleague/raw";
export type { RawPlTeamStats } from "./premierleague/rawStats";
export { plClubSeason } from "./premierleague/clubSeason";
export type { PlClubSeason } from "./premierleague/clubSeason";
// One player's season match by match, keyed by FPL's per-season element id.
export { fetchElementSummary } from "./fpl/client";
export { mapGameLog, totalsOver } from "./gameLog";
export type { GameLogEntry, RateTotals } from "./gameLog";
// One match for every player in it, off the fixture list's `stats` block; it has no minutes.
export { mapMatchSheets, scoresheet, sheetSides } from "./matchSheet";
export { fplDefConAt } from "./defensiveContribution";
// The sister repo's match data: minutes, line-up positions and team figures FPL does not publish.
export { goalMinutes, loggedPlayers, matchIntel, matchLine, subNote } from "./intel/matches";
// Where a man played, as the raw touch points rather than a grid.
export { averageTouchPosition, touchFixtures, touchIntel, touchesOf } from "./intel/touches";
export type { IntelTouches, Touch, TouchCentre, TouchPlayer } from "./intel/touches";
// Every shot, flipped onto the touch clouds' orientation.
export { assistsOf, shotIntel, shotsInFixture } from "./intel/shots";
export { careerIntel, seasonKey } from "./intel/careers";
export type { IntelCareers } from "./intel/careers";
export { cupIntel, cupName, tmlCupTies, seasonRun } from "./intel/cups";
export type { CupTie, IntelCups, RunEntry, TmlRow } from "./intel/cups";
export { depthIntel, depthLines } from "./intel/depth";
export type { ClubDepth, DepthHolder, DepthSlot, DepthSpot, IntelDepth } from "./intel/depth";
// Season-to-date event counts off the stats league, in football terms and keyed on FPL code.
export { STAT_COLUMNS } from "./intel/statKeys";
export type { StatKey } from "./intel/statKeys";
export { columnDrift, per90, stat, statIntel } from "./intel/stats";
export type { IntelStats, StatsRow } from "./intel/stats";
// A window of recent gameweeks, for narrowing the intel to recent form.
export { fixtureGameweeks, gameweekSpan, inGameweeks, lastPlayed } from "./intel/window";
export type { IntelShots, Shot } from "./intel/shots";
// Each club's Dixon-Coles strength from the sister repo, ranked 1–20 as an opponent for the fixture planner.
export { easeStep, plannerGameweeks, plannerRows, strengthIntel, strengthPlaces, strengthTable } from "./intel/strength";
export type { ClubStrength, IntelStrength, PlannerCell, PlannerRow, PlannerView, StrengthRank } from "./intel/strength";
// The sister model's projected FPL points per player per gameweek, for the Projections tab.
export { nextGameweeks, projectedPlace, projectedPoints, projectionIntel } from "./intel/projections";
export { minutesAhead, minutesIntel } from "./intel/minutes";
export type { ExpectedMinutes } from "./intel/minutes";
export { minuteMovesIntel, minutesUpdate } from "./intel/minuteMoves";
export type { IntelMinuteMoves, MinutesMove, MinutesUpdate } from "./intel/minuteMoves";
export type { IntelProjections, ProjectedPlace, ProjectedPlayer, ProjectedGameweek } from "./intel/projections";
export type { MatchSheet, MatchSheetLine, SheetRow } from "./matchSheet";
// His completed seasons before this one.
export { mapPastSeasons } from "./seasons";
export type { PastSeason } from "./seasons";
// Championship Manager's attribute grid, our own ratings from play we already measure.
export { ATTRIBUTE_ROWS, attributes, divisionAttributes, ratedLine, ratedRunning } from "./attributes";
export type { Attribute, Floors, Scouted } from "./attributes";
export { preferredFoot, shotLine } from "./shotLine";
export type { ShotLine } from "./shotLine";
export { lineIntel, playedFloor } from "./intel/lines";
export type { IntelLines, PlayerLine } from "./intel/lines";
export { KEEPER_RANKINGS, OUTFIELD_RANKINGS, rankings } from "./rankings";
export type { Ranked, Tallied } from "./rankings";
export { countryOf, mapFixtures } from "./fpl/map";
export {
  adjacentGameweeks,
  clubById,
  contributions,
  datedKickoffs,
  fixturesInOrder,
  hasGameweek,
  playerByCode,
  squadOf,
  byKickoff,
} from "./selectors";
export type { MatchContribution } from "./selectors";
export { availabilityOf, doubtBand, isDoubtful, onTheBooks } from "./playerState";
export type { Availability, DoubtBand, PlayerState } from "./playerState";
export { formByPlayer, playedRounds } from "./form";
export type { PlayerForm } from "./form";

// Where a round stands in time, as against what a snapshot contains.
export {
  duringGameweek,
  gameweekStarted,
  gameweekStatus,
  isMatchdayLive,
  nextRound,
  secondsToLive,
  roundStarted,
  roundState,
} from "./round";
// `roundFinished` is not exported: it cannot say "live", and `roundState` is the pairing callers want.
export type { RoundState } from "./round";
// A played round rewound to a moment inside it, for rehearsing the Live tab; `app/clock.ts` is the only caller.
export { before, rewindRound, roundAt } from "./replay";
export { fixtureLabel, kickedOff, matchesOver, nextFixtures, oppositionByClub } from "./opposition";
export { leagueTable } from "./table";
export type { TableRow } from "./table";
export { clubStats } from "./clubStats";
export {
  predictedEleven,
  setPieceOrder,
  setPieceRanks,
  squadIntel,
  xiFault,
} from "./intel/map";
export type { SetPieceRank } from "./intel/map";
export { parseScoutXi, sameElevens, xiToWrite } from "./intel/scout";
export {
  defaultDescendingTable,
  isTableSortKey,
  placed,
  sortTable,
} from "./tableOrder";
export type { TableSortKey } from "./tableOrder";
export type { ClubRecord, ClubStats, Result } from "./clubStats";
export type {
  IntelClubPieces,
  IntelClubXi,
  IntelManifest,
  IntelMatch,
  IntelMatchEvent,
  IntelMatchPlayer,
  IntelMatchSide,
  IntelMatches,
  IntelPlayer,
  IntelSquads,
  IntelSetPieces,
  IntelStarter,
  IntelTaker,
  IntelXi,
} from "./intel/types";
export type { Opposition } from "./opposition";
export { FIRM, pressers } from "./intel/pressers";
export type { IntelPressers, PresserQuote, PresserSignal } from "./intel/pressers";
export { intelFreshness } from "./intel/freshness";
export type { IntelKind } from "./intel/freshness";
// A club's strength as the season has gone so far, for weighing a match by its opponent.
export { clubResults, strengthBefore, STRENGTH_SO_FAR } from "./seasonStrength";
export type { ClubResult } from "./seasonStrength";
