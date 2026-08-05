// The league layer's public surface. Import from here, not from the Fantrax
// subfolder — that indirection is what lets our own 27/28 engine replace Fantrax
// as an adapter change rather than a rewrite.

export type {
  LeagueInfo,
  LeaguePeriod,
  LeaguePlayer,
  LeaguePlayerState,
  RosterLimits,
} from "./types";

export { captureStaleness } from "./staleness";
export type { CaptureStaleness } from "./staleness";

export { FantraxError, errorEnvelope } from "./fantrax/errors";
export { mapLeagueInfo, mapPlayerPool, readingOrder } from "./fantrax/map";
export {
  fetchDraftResults,
  fetchLeagueInfo,
  fetchPlayerPool,
  fetchStandings,
  fetchTeamRosters,
} from "./fantrax/client";
