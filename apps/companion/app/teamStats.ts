import {
  FANTRAX_LEAGUE_ID,
  FantraxError,
  fetchPoolStats,
  fetchTeamStats,
  mapPoolStats,
  mapTeamStats,
} from "@epl/core";
import type { TeamStats } from "@epl/core";
import { leagueCache } from "./leagueCache";
import { orRefusal } from "./refusals";
import { SEASON_CODE_LIFE } from "./config";

// One team's season table, read once for its two readers: two caches on one key would be two definitions of it.

/** The season code: Fantrax defaults every stat read to a projection, and one endpoint publishes it. Cached hard. */
const yearToDate = leagueCache(
  "fantrax-season-code",
  async (): Promise<string | undefined> => {
    const raw = await orRefusal(fetchPoolStats(FANTRAX_LEAGUE_ID, 1));
    // No code is no reason to compose one: Fantrax picks, and the callers label it. Only a refusal is caught.
    if (raw instanceof FantraxError) return undefined;
    return mapPoolStats(raw).yearToDate ?? undefined;
  },
  () => undefined,
  SEASON_CODE_LIFE,
);

/** One team's table, or nothing: a refusal (an undrafted league's `WARNING`) and an outage both
 *  mean there are no numbers to show, and both say so by not appearing. */
const readTeamStats = leagueCache("fantrax-team-stats",
  async (teamId: string, season: string | undefined): Promise<TeamStats | null> => {
    const raw = await orRefusal(fetchTeamStats(FANTRAX_LEAGUE_ID, teamId, season));
    return raw instanceof FantraxError ? null : mapTeamStats(raw);
  },
  () => null,
);

/** One squad's season table and its points by player, off one read. A season total: the endpoint ignores a period. */
export async function squadSeason(teamId: string): Promise<SquadSeason | null> {
  const stats = await readTeamStats(teamId, await yearToDate());
  if (stats === null) return null;

  return {
    stats,
    points: new Map(
      stats.groups.flatMap((group) => group.lines.map((line) => [line.fantraxId, line.points])),
    ),
  };
}

export interface SquadSeason {
  /** Fantrax's own table: the season, and a group per scoring vocabulary, keepers apart. */
  stats: TeamStats;
  /** The same lines by player; null is null, never nought. */
  points: Map<string, number | null>;
}
