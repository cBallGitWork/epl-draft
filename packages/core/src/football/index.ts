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
  fixturesInOrder,
  hasGameweek,
  isDoubtful,
  playerByCode,
} from "./selectors";
export type { MatchContribution } from "./selectors";

// What a round is doing, as against what a snapshot contains — see `round.ts`
// for why the two are separate questions and why asking one in place of the
// other has bitten more than once.
export {
  duringGameweek,
  gameweekStarted,
  gameweekStatus,
  isMatchdayLive,
  roundFinished,
  roundState,
} from "./round";
export type { FinishedState, RoundState } from "./round";
export { kickedOff, oppositionByClub } from "./opposition";
export type { Opposition } from "./opposition";
