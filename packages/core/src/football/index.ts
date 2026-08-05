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
  Position,
} from "./types";

export { CLUB_COLOURS, clubColours, crestUrl, inkOn } from "./clubs";
export type { ClubColours } from "./clubs";
export { initials, portraitUrl } from "./portraits";
export type { PortraitSize } from "./portraits";
export { getFootballSnapshot } from "./snapshot";
export {
  clubById,
  contributions,
  fixturesInOrder,
  isMatchdayLive,
  playerById,
} from "./selectors";
export type { MatchContribution } from "./selectors";
