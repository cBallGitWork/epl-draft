// The football layer's public surface. Import from here, not from the FPL
// subfolder — that indirection is what lets the provider change without the app
// noticing, and it is the same discipline that made swapping Draft Fantasy for
// Fantrax an adapter change rather than a rewrite.

export type {
  Club,
  Fixture,
  FixtureStatus,
  FootballPlayer,
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
export { mapFixtures } from "./fpl/map";
export {
  adjacentGameweeks,
  clubById,
  contributions,
  duringGameweek,
  fixturesInOrder,
  gameweekStatus,
  hasGameweek,
  isDoubtful,
  gameweekStarted,
  isMatchdayLive,
  playerByCode,
  roundFinished,
  roundState,
} from "./selectors";
export type { FinishedState, MatchContribution, RoundState } from "./selectors";
export { oppositionByClub } from "./opposition";
export type { Opposition } from "./opposition";
