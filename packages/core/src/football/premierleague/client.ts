import { PL_COMPETITION, PL_COMP_SEASON, PL_FOOTBALL_API_BASE, PL_TEXTSTREAM_PAGE } from "../../config";
import { fetchJson } from "../../http/get";
import type {
  RawPlFixture,
  RawPlFixturePage,
  RawPlStaff,
  RawPlTextstream,
} from "./raw";
import type { RawPlMatchStats, RawPlPlayerStats, RawPlTeamPage, RawPlTeamStats } from "./rawStats";

// All Premier League API I/O, server-side only: it allows only premierleague.com's origin, so a browser is refused.
// Their CDN caches for 30 seconds, so polling faster is served the same bytes.

/** Throws: a default would print silence as "nothing happened". */
async function get<T>(path: string): Promise<T> {
  return (await fetchJson(`${PL_FOOTBALL_API_BASE}${path}`, "Premier League", path)) as T;
}

/** One gameweek's fixtures, with every goal of all ten matches (scorer, assister, minute) in one request.
 *  `altIds=true` is required: without it no fixture carries `altIds` and there is no join to FPL. */
export function fetchPlRound(gameweek: number): Promise<RawPlFixturePage> {
  return get<RawPlFixturePage>(
    `/fixtures?comps=${PL_COMPETITION}&compSeasons=${PL_COMP_SEASON}` +
      `&gameweekNumbers=${gameweek}&pageSize=20&page=0&sort=asc&altIds=true`,
  );
}

/** One fixture in full: team sheets, formations, shirt numbers, referee; the only complete source of the player-id join. */
export function fetchPlFixture(id: number): Promise<RawPlFixture> {
  return get<RawPlFixture>(`/fixtures/${id}`);
}

/** Opta's commentary for one fixture; an unplayed one answers its header and an empty `content`, not an error. */
export function fetchPlTextstream(id: number): Promise<RawPlTextstream> {
  return get<RawPlTextstream>(
    `/fixtures/${id}/textstream/EN?pageSize=${PL_TEXTSTREAM_PAGE}&sort=asc`,
  );
}

/** Every Opta metric for both sides of one match; a metric worth nought is absent, not zero (see `RawPlMetric`). */
export function fetchPlMatchStats(id: number): Promise<RawPlMatchStats> {
  return get<RawPlMatchStats>(`/stats/match/${id}`);
}

/** One man's Opta metrics in one match, by the Premier League's ids for both. */
export function fetchPlPlayerMatchStats(playerId: number, fixtureId: number): Promise<RawPlPlayerStats> {
  return get<RawPlPlayerStats>(`/stats/player/${playerId}?fixtures=${fixtureId}`);
}

/** The season's twenty clubs, with the Opta id that joins each to FPL's club `code`. */
export function fetchPlTeams(): Promise<RawPlTeamPage> {
  return get<RawPlTeamPage>(`/teams?comps=${PL_COMPETITION}&compSeasons=${PL_COMP_SEASON}&pageSize=30&altIds=true`);
}

/** One club's season to date: about 215 Opta metrics, summed over its league matches. */
export function fetchPlTeamStats(teamId: number): Promise<RawPlTeamStats> {
  return get<RawPlTeamStats>(`/stats/team/${teamId}?comps=${PL_COMPETITION}&compSeasons=${PL_COMP_SEASON}&altIds=true`);
}


/** A club's registered squad and officials this season; the officials include its manager. */
export function fetchPlStaff(teamId: number): Promise<RawPlStaff> {
  return get<RawPlStaff>(`/teams/${teamId}/compseasons/${PL_COMP_SEASON}/staff?type=all`);
}
