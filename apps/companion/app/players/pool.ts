import {
  FANTRAX_LEAGUE_ID,
  FantraxError,
  POOL_PAGE_SIZE,
  fetchLeagueInfo,
  fetchPlayerPool,
  fetchPoolStats,
  fetchTeamRosters,
  leaguePool,
  mapLeagueInfo,
  mapPlayerPool,
  mapPoolStats,
  mapTeamRosters,
  fplCodeOf,
  onTheBooks,
  playerByCode,
  byPositionDepth,
} from "@epl/core";
import type { PoolStatRow, PoolPlayer, StatSeason } from "@epl/core";
import { footballNow } from "../football";
import { leagueCache } from "../leagueCache";
import { orRefusal, tell, unavailable } from "../refusals";
import type { Unavailable } from "../refusals";
import { bridge } from "../squads";

// Fantrax's pool, our league's view of each man and who holds him, joined by core's `leaguePool`; here is which
// failures are fatal and which are ordinary states of a league.

/** One player as the table shows him: who he is, what our league says about him,
 *  and Fantrax's own number against his name. */
export interface PoolRow {
  entry: PoolPlayer;
  /** Null for a player Fantrax's stats read did not carry: a dash on screen. */
  stats: PoolStatRow | null;
  /** FPL's season-stable code off the bridge, or null for a man FPL has never listed. */
  fplCode: number | null;
}

/** Everything the pool view needs, minus the one field a cache cannot hold. */
interface Pool {
  rows: PoolRow[];
  /** The league's own position letters, in pitch order: a commissioner setting, read from its caps. */
  positions: string[];
  /** Which numbers the points column holds, as Fantrax labelled them; null when the stats read failed. */
  season: StatSeason | null;
  /** How many players Fantrax has stats for that this read did not carry; printed when not nought. */
  missing: number;
  /** Why there are no numbers, when there are none, so a page of dashes says why. */
  statsRefused: string | null;
}

/** The pool with team ids to names, built from the rosters already held. */
export type LeaguePool = (Pool & { teamNames: Map<string, string> }) | Unavailable;

/** What the cache can hold: a Map comes back from it as `{}`, so the names go in as entries. */
type CachedPool = (Pool & { teamNames: [string, string][] }) | Unavailable;

const readPool = leagueCache("league-pool", readLeaguePool, unavailable);

/** The pool, read once for everybody (every route is dynamic, so uncached it is four reads per view per phone). */
export async function getLeaguePool(): Promise<LeaguePool> {
  const cached = await readPool();
  if ("unavailable" in cached) return cached;
  return { ...cached, rows: await stillHere(cached.rows), teamNames: new Map(cached.teamNames) };
}

/** Drops men who have left the division, whom Fantrax keeps as free agents; outside the cache, so a departure shows
 *  on the next football read. A man FPL never listed is kept. */
async function stillHere(rows: PoolRow[]): Promise<PoolRow[]> {
  const football = playerByCode(await footballNow());
  return rows.filter((row) => {
    const player = row.fplCode === null ? undefined : football.get(row.fplCode);
    return player === undefined || onTheBooks(player);
  });
}

async function readLeaguePool(): Promise<CachedPool> {
  const [pool, info, rosters, stats] = await Promise.all([
    orRefusal(fetchPlayerPool()),
    orRefusal(fetchLeagueInfo(FANTRAX_LEAGUE_ID)),
    orRefusal(fetchTeamRosters(FANTRAX_LEAGUE_ID)),
    // Failure-tolerant, unlike the three above: it adds columns to a page worth showing without them.
    orRefusal(fetchPoolStats(FANTRAX_LEAGUE_ID, POOL_PAGE_SIZE)),
  ]);

  if (pool instanceof FantraxError) return unavailable(pool);
  if (info instanceof FantraxError) return unavailable(info);

  // A league with no teams owns nobody; any other roster failure would call every man unowned, so it is fatal.
  if (rosters instanceof FantraxError && rosters.code !== "NO_TEAMS") {
    return unavailable(rosters);
  }
  const held = rosters instanceof FantraxError ? { period: null, teams: [] } : mapTeamRosters(rosters);

  const league = mapLeagueInfo(info);
  const scored = stats instanceof FantraxError ? null : mapPoolStats(stats);
  const byId = new Map((scored?.rows ?? []).map((row) => [row.fantraxId, row]));

  return {
    rows: leaguePool(mapPlayerPool(pool), league.players, held).map((entry) => {
      return {
        entry,
        stats: byId.get(entry.player.fantraxId) ?? null,
        fplCode: fplCodeOf(bridge, entry.player.fantraxId),
      };
    }),
    positions: Object.keys(league.roster.maxActiveByPosition).sort(byPositionDepth),
    teamNames: held.teams.map((team) => [team.teamId, team.teamName]),
    season: scored?.season ?? null,
    missing: Math.max(0, (scored?.total ?? 0) - (scored?.rows.length ?? 0)),
    statsRefused: stats instanceof FantraxError ? tell(stats) : null,
  };
}
