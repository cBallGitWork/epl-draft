// The league layer's public surface. Import from here, not from the Fantrax
// subfolder — that indirection is what lets our own 27/28 engine replace Fantrax
// as an adapter change rather than a rewrite.

export type {
  LeagueInfo,
  LeagueMatchup,
  LeaguePeriod,
  LeaguePlayer,
  LeaguePlayerState,
  LeagueTeam,
  PeriodRosters,
  RosterLimits,
  RosterSlot,
  StandingsRow,
  TeamRoster,
} from "./types";

export { captureStaleness } from "./staleness";
export type { CaptureStaleness } from "./staleness";

export { periodGameweeks } from "./calendar";
export type { GameweekKickoff, PeriodGameweeks } from "./calendar";

export {
  latestStartedPeriod,
  lineupVisible,
  periodAt,
  periodStarted,
  rosterDisplay,
} from "./visibility";
export type { RosterDisplay, SquadReason } from "./visibility";

export { FantraxError, errorEnvelope } from "./fantrax/errors";
export { mapLeagueInfo, mapPlayerPool, readingOrder } from "./fantrax/map";
export { mapTeamRosters } from "./fantrax/rosters";
export { mapStandings } from "./fantrax/standings";
export {
  fetchDraftResults,
  fetchLeagueInfo,
  fetchPlayerPool,
  fetchStandings,
  fetchTeamRosters,
} from "./fantrax/client";
