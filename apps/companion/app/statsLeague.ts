import { FantraxError, KEEPER, OUTFIELD, POOL_PAGE_SIZE, type RawPlayerStats, fetchPoolStats, mapPlayerStats } from "@epl/core";
import { leagueCache } from "./leagueCache";
import { orRefusal } from "./refusals";
import recorded from "../../../data/leagues/recorded.json";

/** The league recorded under the `stats` role, listing every column at no points so the served
 *  league need not. Named in data, as `npm run stats` names it, so both read the same league. */
export const STATS_LEAGUE = recorded.leagues.find((league) => league.key === recorded.stats)?.leagueId ?? null;

/** One man's season counts in the stats league: his Fantrax id and the columns asked for, as entries for the cache. */
export type StatsLeagueLine = [fantraxId: string, counts: Record<string, number | null>];

/** Every man's season in the stats league, both halves, kept to `keys`; empty when the role names no league. */
export const statsLeagueSeason = leagueCache(
  "stats-league-season",
  async (keys: readonly string[]): Promise<StatsLeagueLine[]> => {
    if (STATS_LEAGUE === null) return [];
    const halves = await Promise.all(
      [OUTFIELD, KEEPER].map((group) => orRefusal(fetchPoolStats(STATS_LEAGUE, POOL_PAGE_SIZE, undefined, group))),
    );
    return halves.flatMap((half) => kept(half, keys));
  },
  () => [],
);

/** One half's men with only the asked columns each carries; nothing when that half refused. */
function kept(half: RawPlayerStats | FantraxError, keys: readonly string[]): StatsLeagueLine[] {
  if (half instanceof FantraxError) return [];
  return mapPlayerStats(half).map((line) => [
    line.fantraxId,
    Object.fromEntries(keys.filter((key) => key in line.stats).map((key) => [key, line.stats[key]])),
  ]);
}
