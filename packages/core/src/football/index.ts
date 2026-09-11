// The football layer's public surface. Import from here, not from the FPL
// subfolder — that indirection is what lets the provider change without the app
// noticing, and it is the same discipline that made swapping Draft Fantasy for
// Fantrax an adapter change rather than a rewrite.

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

export { clubColours, clubGround, crestForShortName, crestUrl, inkOn, plateOn, shirtUrl } from "./clubs";
export type { ClubColours } from "./clubs";
// The photograph behind a club's own screens, and the credit it must carry.
export { clubGroundPhoto, groundPhotoCredits } from "./grounds";
export type { GroundPhoto } from "./grounds";
export { initials, portraitUrl } from "./portraits";
export { getFootballSnapshot } from "./snapshot";
// The two reads `getFootballSnapshot` does not serve, both wanted by scripts:
// the whole-season fixture list (it fetches one gameweek) and the raw bootstrap
// (it returns a mapped snapshot, and the bridge needs FPL's own field names).
export { fetchBootstrap, fetchFixtures } from "./fpl/client";
// One round's live feed, and the mapper that turns it into per-FIXTURE figures.
// `getFootballSnapshot` reads both for the round it is building; a match screen
// wants an OLDER round, which is the whole reason these are reachable on their
// own. `football.ts`'s `gameweekLive` says what it costs and what it buys.
export { fetchLive } from "./fpl/client";
export { mapLiveStats, roundPlayed } from "./fpl/map";
// The Premier League's own feed — the football layer's SECOND provider, and the
// only source of a goal's minute, a real match clock, a team sheet or a
// substitution. FPL publishes none of them. It joins on ids neither provider
// chose: `Fixture.code` against their `altIds.opta`, and FPL's `opta_code`
// against a player's. Server-side only; their CORS admits their own site alone.
export {
  fetchPlFixture,
  fetchPlMatchStats,
  fetchPlRound,
  fetchPlTextstream,
} from "./premierleague/client";
export {
  mapMatchEvents,
  mapRoundGoals,
  plFixtureCode,
  plCommentary,
  worthReading,
  plMatchMetrics,
} from "./premierleague/map";
export type { PlCommentaryLine } from "./premierleague/map";
export { plPlayerCodes, plTeamSheets } from "./premierleague/teamSheet";
export type { PlSquadMan, PlTeamSheet } from "./premierleague/teamSheet";
export { plManMatches, plSubstitutions } from "./premierleague/sheetEvents";
export type { PlManMatch, PlSubstitution } from "./premierleague/sheetEvents";
export { creditedGoals, goalGroups, plGoals } from "./premierleague/goals";
export type { PlGoal, PlGoalGroup } from "./premierleague/goals";
export { injuredOff, streamCredited, streamCredits } from "./premierleague/assists";
export type { StreamCredit } from "./premierleague/assists";
export { fetchHighlightsFeed } from "./highlightsClient";
export { highlightFor, parseHighlightFeed, parseHighlightTitle } from "./highlights";
export type { HighlightVideo } from "./highlights";
export { plMatchBoard } from "./premierleague/matchStats";
export type { MatchStatRow } from "./premierleague/matchStats";
export { mapRoundBreaks } from "./premierleague/breaks";
export { plMatchFacts } from "./premierleague/matchFacts";
export { plWireLines, proseSpans, shortProse } from "./premierleague/prose";
export type { ProseSpan } from "./premierleague/prose";
export type { ProseLine } from "./premierleague/prose";
export type { PlMatchFacts } from "./premierleague/matchFacts";
export type { RoundBreak } from "./premierleague/breaks";
export type {
  RawPlEvent,
  RawPlFixture,
  RawPlFixturePage,
  RawPlFixtureEvent,
  RawPlGoal,
  RawPlTeamList,
  RawPlTextstream,
} from "./premierleague/raw";
export type { RawPlMatchStats, RawPlMetric } from "./premierleague/rawStats";
// One player's own season, match by match — the only read here keyed by FPL's
// per-season element id, and the only one with the four measurements a live
// snapshot cannot give per fixture. `gameLog.ts` says why.
export { fetchElementSummary } from "./fpl/client";
export { mapGameLog } from "./gameLog";
export type { GameLogEntry } from "./gameLog";
// What happened in ONE MATCH, for every player in it, off the season fixture
// list's own `stats` block — the read the app already makes and used to throw
// away. `matchSheet.ts` sets it against the two neighbours above and says what
// it cannot answer, which is minutes.
export { mapMatchSheets, scoresheet, sheetSides } from "./matchSheet";
// The other half of a match, from the sister repo: the minutes, the line-up
// positions and the team figures FPL publishes nowhere. `intel/matches.ts` sets
// it against the read above and says which one wins where both could answer.
export { goalMinutes, loggedPlayers, matchIntel, matchLine, subNote } from "./intel/matches";
// Where a man played, as the points themselves rather than as a grid. The
// argument for the raw cloud — smaller than the grid AND smoother, because the
// busiest player in the league has 414 season touches — is in `intel/touches.ts`.
export { touchFixtures, touchIntel, touchesOf } from "./intel/touches";
export type { IntelTouches, Touch, TouchPlayer } from "./intel/touches";
// Every shot, already flipped onto the touch clouds' convention — SofaScore
// publishes a shot as distance from the attacking goal and a touch the other way
// round, and `intel/shots.ts` records how that was settled.
export { mirrorShot, shotIntel, shotsInFixture, shotsOf } from "./intel/shots";
export type { IntelShots, Shot } from "./intel/shots";
export type { MatchSheet, MatchSheetLine, SheetRow } from "./matchSheet";
// The same read at season scale — his career before this one. `seasons.ts` says
// why it is a separate file and why its column set is as short as it is.
export { mapPastSeasons } from "./seasons";
export type { PastSeason } from "./seasons";
// Championship Manager's attribute grid, rated out of play we already measure.
// Ours, never Sports Interactive's — `attributes.ts` says why there is no feed.
export { attributes } from "./attributes";
export type { Attribute, Scouted } from "./attributes";
export { KEEPER_ONLY, OUTFIELD_ONLY } from "./attributes";
export { mapFixtures } from "./fpl/map";
export {
  adjacentGameweeks,
  clubById,
  contributions,
  datedKickoffs,
  fixturesInOrder,
  hasGameweek,
  playerByCode,
  squadOf,
} from "./selectors";
export type { MatchContribution } from "./selectors";
export { availabilityOf, isDoubtful, onTheBooks } from "./playerState";
export type { Availability, PlayerState } from "./playerState";
export { formByPlayer, playedRounds } from "./form";
export type { PlayerForm, RoundStats } from "./form";

// What a round is doing, as against what a snapshot contains — see `round.ts`
// for why the two are separate questions and why asking one in place of the
// other has bitten more than once.
export {
  duringGameweek,
  gameweekStarted,
  gameweekStatus,
  isMatchdayLive,
  nextRound,
  roundStarted,
  roundState,
} from "./round";
// `roundFinished` is deliberately not here. It is half an answer — it cannot say
// "live" — and `roundState` is the pairing every caller wants; publishing both
// is publishing the one that has been asked in the other's place before. It
// stays exported from its own module, where its tests reach it.
export type { FinishedState, RoundState } from "./round";
export { fixtureLabel, kickedOff, nextFixtures, oppositionByClub } from "./opposition";
export { leagueTable } from "./table";
export type { TableRow } from "./table";
export { clubStats } from "./clubStats";
export {
  predictedEleven,
  predictionAge,
  setPieceOrder,
  squadIntel,
  xiFault,
  xiRoundFault,
} from "./intel/map";
export {
  defaultDescendingTable,
  isTableSortKey,
  placed,
  sortTable,
} from "./tableOrder";
export type { PlacedRow, TableSortKey } from "./tableOrder";
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
