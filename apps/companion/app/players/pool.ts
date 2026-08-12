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
import { orRefusal, tell } from "../refusals";
import type { Unavailable } from "../refusals";

// Three reads meet on this page: Fantrax's global EPL pool, our league's opinion
// of every player in it, and who currently holds them. The join is core's
// (`leaguePool`); what belongs here is which failures are fatal to the page and
// which are ordinary states of a league that has not drafted.

/** Everything the pool view needs, or which read stopped it.
 *
 *  Three reads can fail here rather than one, and "which one" is the first useful
 *  question — which is why the tell carries the method (see `refusals.ts`). */
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
  | Unavailable;

export async function getLeaguePool(): Promise<LeaguePool> {
  const [pool, info, rosters] = await Promise.all([
    orRefusal(fetchPlayerPool()),
    orRefusal(fetchLeagueInfo(FANTRAX_LEAGUE_ID)),
    orRefusal(fetchTeamRosters(FANTRAX_LEAGUE_ID)),
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
  return {
    players: leaguePool(mapPlayerPool(pool), league.players, held),
    positions: Object.keys(league.roster.maxActiveByPosition).sort(
      (a, b) => positionDepth(a) - positionDepth(b),
    ),
    teamNames: new Map(held.teams.map((team) => [team.teamId, team.teamName])),
  };
}
