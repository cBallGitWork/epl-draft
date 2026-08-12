import {
  FANTRAX_LEAGUE_ID,
  FantraxError,
  fetchLeagueInfo,
  fetchPlayerPool,
  fetchTeamRosters,
  leaguePool,
  mapLeagueInfo,
  mapPlayerPool,
  mapTeamRosters,
  positionDepth,
} from "@epl/core";
import type { PoolPlayer } from "@epl/core";

// Three reads meet on this page: Fantrax's global EPL pool, our league's opinion
// of every player in it, and who currently holds them. The join is core's
// (`leaguePool`); what belongs here is which failures are fatal to the page and
// which are ordinary states of a league that has not drafted.

/** Everything the pool view needs, or which read stopped it.
 *
 *  `unavailable` carries the method as well as the code, because unlike /team
 *  there is more than one read that can fail and "which one" is the first useful
 *  question. */
export type LeaguePool =
  | {
      players: PoolPlayer[];
      /** The league's own position vocabulary, in pitch order. Read from its caps
       *  rather than written out here: the letters are a commissioner setting. */
      positions: string[];
      /** Team ids to names, for the one column that names an owner. Built from the
       *  rosters we already hold rather than from a second payload. */
      teamNames: Map<string, string>;
    }
  | { unavailable: string };

function fantrax(error: unknown): FantraxError {
  if (error instanceof FantraxError) return error;
  throw error;
}

export async function getLeaguePool(): Promise<LeaguePool> {
  const [pool, info, rosters] = await Promise.all([
    fetchPlayerPool().catch(fantrax),
    fetchLeagueInfo(FANTRAX_LEAGUE_ID).catch(fantrax),
    fetchTeamRosters(FANTRAX_LEAGUE_ID).catch(fantrax),
  ]);

  if (pool instanceof FantraxError) return { unavailable: `getPlayerIds → ${pool.code}` };
  if (info instanceof FantraxError) return { unavailable: `getLeagueInfo → ${info.code}` };

  // A league with no teams owns nobody, and saying so is true rather than
  // hedged — it is the state our real league is in until 10 Oct. Any OTHER
  // failure here is different in kind: it would leave every row on the page
  // quietly claiming a player is unowned, which is a confident wrong answer
  // about 697 players at once.
  if (rosters instanceof FantraxError && rosters.code !== "NO_TEAMS") {
    return { unavailable: `getTeamRosters → ${rosters.code}` };
  }
  const held = rosters instanceof FantraxError ? { period: null, teams: [] } : mapTeamRosters(rosters);

  const league = mapLeagueInfo(info);
  return {
    players: leaguePool(mapPlayerPool(pool), league.players, held),
    positions: Object.keys(league.roster.maxActiveByPosition).sort(
      (a, b) => positionDepth(a) - positionDepth(b),
    ),
    teamNames: new Map(held.teams.map((team) => [team.teamId, team.teamName])),
  };
}
