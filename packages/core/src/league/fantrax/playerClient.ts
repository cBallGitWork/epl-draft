import { fxpaRead } from "./fxpa";
import type { PositionGroup } from "./playerStats";
import type { RawPlayerProfile } from "./profile";
import type { RawPoolStats } from "./stats";
import type { RawNewsSection, RawPoolNews } from "./playerNews";

// Fantrax's reads about players, all public on fxpa.

/** Fantrax's dossier on one player. The parameter is `playerId`: `scorerId` and `fantraxId` answer `INVALID_REQUEST`. */
export function fetchPlayerProfile(leagueId: string, playerId: string): Promise<RawPlayerProfile> {
  return fxpaRead(leagueId, "getPlayerProfile", { playerId }) as Promise<RawPlayerProfile>;
}

/** Everything written about one player, newest first: `tab` takes a section `code` off the profile's own list. */
export function fetchPlayerStories(leagueId: string, playerId: string): Promise<RawNewsSection> {
  return fxpaRead(leagueId, "getPlayerProfile", {
    playerId,
    tab: "NEWS_NOTES",
  }) as Promise<RawNewsSection>;
}

/** The pool's last day of news in one request. `poolType` is required (`MISSING_PARAM` without it). */
export function fetchPoolNews(leagueId: string): Promise<RawPoolNews> {
  return fxpaRead(leagueId, "getPlayerNews", { poolType: "ALL" }) as Promise<RawPoolNews>;
}

/** The whole pool with Fantrax's points, in one request: `maxResultsPerPage` is honoured up to the full pool.
 *  `season` is omitted until known, since this read publishes the codes; a year-to-date code can come back as a
 *  projection, so read the season it answers. */
export function fetchPoolStats(
  leagueId: string,
  perPage: number,
  season?: string,
  /** Named, it switches raw stats on; omitted or `"ALL"`, it answers the fantasy columns alone. */
  positionOrGroup?: PositionGroup,
  /** One scoring period's numbers: `transactionPeriod`, off the page's own URL; `period` is ignored. */
  period?: number,
  /** One London day's numbers, `2026-09-19`; needs the season's `BY_DATE` code as `season`. */
  date?: string,
): Promise<RawPoolStats> {
  return fxpaRead(leagueId, "getPlayerStats", {
    statusOrTeamFilter: "ALL",
    pageNumber: "1",
    maxResultsPerPage: String(perPage),
    ...(positionOrGroup ? { positionOrGroup } : {}),
    ...(season ? { seasonOrProjection: season } : {}),
    ...(period === undefined ? {} : { timeframeTypeCode: "BY_PERIOD", transactionPeriod: String(period) }),
    ...(date === undefined ? {} : { timeframeTypeCode: "BY_DATE", startDate: date, endDate: date }),
  }) as Promise<RawPoolStats>;
}

/** One row of the pool, asked for the season codes the read publishes (`mapPoolStats`), never for a player. */
export function fetchSeasonCodes(leagueId: string): Promise<RawPoolStats> {
  return fetchPoolStats(leagueId, 1);
}
