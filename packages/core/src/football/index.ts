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
} from "./types";

export { clubColours, crestUrl, inkOn, shirtUrl } from "./clubs";
export type { ClubColours } from "./clubs";
export { initials, portraitUrl } from "./portraits";
export { getFootballSnapshot } from "./snapshot";
// The two reads `getFootballSnapshot` does not serve, both wanted by scripts:
// the whole-season fixture list (it fetches one gameweek) and the raw bootstrap
// (it returns a mapped snapshot, and the bridge needs FPL's own field names).
export { fetchBootstrap, fetchFixtures } from "./fpl/client";
// One player's own season, match by match — the only read here keyed by FPL's
// per-season element id, and the only one with the four measurements a live
// snapshot cannot give per fixture. `gameLog.ts` says why.
export { fetchElementSummary } from "./fpl/client";
export { mapGameLog } from "./gameLog";
export type { GameLogEntry } from "./gameLog";
export { mapFixtures } from "./fpl/map";
export {
  adjacentGameweeks,
  clubById,
  contributions,
  datedKickoffs,
  fixturesInOrder,
  hasGameweek,
  playerByCode,
} from "./selectors";
export type { MatchContribution } from "./selectors";
export { availabilityOf, isDoubtful } from "./playerState";
export type { Availability, PlayerState } from "./playerState";

// What a round is doing, as against what a snapshot contains — see `round.ts`
// for why the two are separate questions and why asking one in place of the
// other has bitten more than once.
export {
  duringGameweek,
  gameweekStarted,
  gameweekStatus,
  isMatchdayLive,
  nextRound,
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
  defaultDescendingTable,
  isTableSortKey,
  placed,
  sortTable,
} from "./tableOrder";
export type { PlacedRow, TableSortKey } from "./tableOrder";
export type { ClubStats, Record as ClubRecord, Result } from "./clubStats";
export type { Opposition } from "./opposition";
