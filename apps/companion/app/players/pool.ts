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
  isUnmapped,
  onTheBooks,
  playerByCode,
  positionDepth,
} from "@epl/core";
import type { PoolStatRow, PoolPlayer, StatSeason } from "@epl/core";
import { footballNow } from "../football";
import { leagueCache } from "../leagueCache";
import { orRefusal, tell } from "../refusals";
import type { Unavailable } from "../refusals";
import { bridge } from "../squads";

// Three reads meet on this page: Fantrax's global EPL pool, our league's opinion
// of every player in it, and who currently holds them. The join is core's
// (`leaguePool`); what belongs here is which failures are fatal to the page and
// which are ordinary states of a league that has not drafted.

/** One player as the table shows him: who he is, what our league says about him,
 *  and Fantrax's own number against his name. */
export interface PoolRow {
  entry: PoolPlayer;
  /** Null for a player Fantrax's stats read did not carry — an ordinary state
   *  for the academy names in the pool, and a dash on screen. */
  stats: PoolStatRow | null;
  /** FPL's season-stable player code, for his photograph, or null when the
   *  bridge has not settled him.
   *
   *  Read straight off the bridge rather than resolved through the snapshot: the
   *  code is the only thing a portrait needs. Null is ordinary — 120 of the 688
   *  are academy names FPL has never listed — and it costs the photograph,
   *  nothing else.
   *
   *  It is also what `stillHere` filters on, which is the one football read this
   *  page makes. That read is a hard dependency rather than a column that may
   *  fail: a pool offering men who have left the division is wrong in a way a
   *  missing photograph is not. */
  fplCode: number | null;
}

/** Everything the pool view needs, minus the one field a cache cannot hold.
 *
 *  Four reads can fail here rather than one, and "which one" is the first useful
 *  question — which is why the tell carries the method (see `refusals.ts`). */
interface Pool {
  rows: PoolRow[];
  /** The league's own position vocabulary, in pitch order. Read from its caps
   *  rather than written out here: the letters are a commissioner setting. */
  positions: string[];
  /** Which numbers the points column holds, as Fantrax labelled them. Null when
   *  the stats read failed, which costs the column and not the page. */
  season: StatSeason | null;
  /** How many players Fantrax has stats for that this read did not carry.
   *  Nought in the ordinary case; anything else is printed rather than left to
   *  look like a pool with missing numbers. */
  missing: number;
  /** Why there are no numbers, when there are none. Without it a failed stats
   *  read renders seven hundred rows of dashes with nothing to say why, which
   *  reads as a pool Fantrax has never scored rather than as a read that did
   *  not answer. */
  statsRefused: string | null;
}

/** Team ids to names, for the one column that names an owner. Built from the
 *  rosters we already hold rather than from a second payload. */
export type LeaguePool = (Pool & { teamNames: Map<string, string> }) | Unavailable;

/** What the cache can hold. `unstable_cache` serialises and a Map does not
 *  survive the round trip — it comes back as `{}` and every owner column
 *  silently reads "unowned". Entries go in, the Map is built on the way out. */
type CachedPool = (Pool & { teamNames: [string, string][] }) | Unavailable;

const readPool = leagueCache("league-pool", readLeaguePool);

/** Cached, and that is not an optimisation.
 *
 *  Reading the session cookie in the layout makes every route dynamic, so
 *  without this the whole pool — a 533 KB stats payload among four reads — is
 *  fetched again for every view by every phone. The league is the same for
 *  everybody, so it is fetched once and rendered sixteen ways; nothing personal
 *  is inside the cache. */
export async function getLeaguePool(): Promise<LeaguePool> {
  const cached = await readPool();
  if ("unavailable" in cached) return cached;
  return { ...cached, rows: await stillHere(cached.rows), teamNames: new Map(cached.teamNames) };
}

/** The site rule applied to the pool, which is the one list on the site that
 *  says who you could pick up.
 *
 *  **Fantrax keeps the departed listed as free agents.** Woltemade was still in
 *  `getPlayerIds` and still `FA` in `playerInfo` on 11 Sep, after FPL had him at
 *  Juventus — so their pool offers a manager a man he cannot have, and only the
 *  football layer knows it.
 *
 *  **Outside the cache on purpose.** The pool is cached as Fantrax answered it
 *  and stays one provider's payload; the two reads have different lifetimes, and
 *  baking a football fact into a Fantrax cache is how a man who left in October
 *  goes on being offered until the entry expires. `footballNow` is the layout's
 *  own cached read, so asking for it here costs nothing.
 *
 *  A row with no `fplCode` is kept. That is the bridge saying FPL has never
 *  listed him — 120 academy names — which is a settled answer about identity and
 *  says nothing about whether he is at a club. */
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
    // Failure-tolerant, unlike the three above: this read adds a column to a
    // page that was worth showing without it.
    orRefusal(fetchPoolStats(FANTRAX_LEAGUE_ID, POOL_PAGE_SIZE)),
  ]);

  if (pool instanceof FantraxError) return { unavailable: tell(pool) };
  if (info instanceof FantraxError) return { unavailable: tell(info) };

  // A league with no teams owns nobody, and saying so is true rather than
  // hedged — it is the state our real league is in until 10 Oct. Any OTHER
  // failure here is different in kind: it would leave every row on the page
  // quietly claiming a player is unowned, which is a confident wrong answer
  // about 697 players at once.
  if (rosters instanceof FantraxError && rosters.code !== "NO_TEAMS") {
    return { unavailable: tell(rosters) };
  }
  const held = rosters instanceof FantraxError ? { period: null, teams: [] } : mapTeamRosters(rosters);

  const league = mapLeagueInfo(info);
  const scored = stats instanceof FantraxError ? null : mapPoolStats(stats);
  const byId = new Map((scored?.rows ?? []).map((row) => [row.fantraxId, row]));

  return {
    rows: leaguePool(mapPlayerPool(pool), league.players, held).map((entry) => {
      const mapped = bridge[entry.player.fantraxId];
      return {
        entry,
        stats: byId.get(entry.player.fantraxId) ?? null,
        // Asked through the bridge's own guard rather than by sniffing for the
        // field: an unmapped row records that FPL has no such player, which is a
        // settled answer and not a gap, and the check belongs with the type.
        fplCode: mapped && !isUnmapped(mapped) ? mapped.fplCode : null,
      };
    }),
    positions: Object.keys(league.roster.maxActiveByPosition).sort(
      (a, b) => positionDepth(a) - positionDepth(b),
    ),
    teamNames: held.teams.map((team) => [team.teamId, team.teamName]),
    season: scored?.season ?? null,
    missing: Math.max(0, (scored?.total ?? 0) - (scored?.rows.length ?? 0)),
    statsRefused: stats instanceof FantraxError ? tell(stats) : null,
  };
}
