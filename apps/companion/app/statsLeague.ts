import { unstable_cache } from "next/cache";
import {
  FantraxError,
  KEEPER,
  OUTFIELD,
  POOL_PAGE_SIZE,
  type RawPlayerStats,
  fetchLeagueInfo,
  fetchPoolStats,
  mapLeagueInfo,
  mapPlayerStats,
  recordedRole,
} from "@epl/core";
import { FINAL_REVALIDATE, STATS_PERIODS_REVALIDATE } from "./config";
import { leagueCache } from "./leagueCache";
import { orRefusal, refusedAs } from "./refusals";
import recorded from "../../../data/leagues/recorded.json";

/** The league recorded under the `stats` role, listing every column at no points so the served
 *  league need not. Named in data, as `npm run stats` names it, so both read the same league. */
export const STATS_LEAGUE = recordedRole(recorded, "stats");

/** A league's own periods; the stats league's calendar need not be the served league's. The league
 *  is an argument, so it is in the cache key by construction. */
export const periodsOf = unstable_cache(
  (league: string) => refusedAs(fetchLeagueInfo(league), () => [], (raw) => mapLeagueInfo(raw).scoringPeriods),
  ["league-periods"],
  { revalidate: STATS_PERIODS_REVALIDATE },
);

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
  return mapPlayerStats(half).map((line) => [line.fantraxId, only(line.stats, keys)]);
}

/** The asked columns a line carries, and no others. */
function only(stats: Record<string, number | null>, keys: readonly string[]): Record<string, number | null> {
  return Object.fromEntries(keys.filter((key) => key in stats).map((key) => [key, stats[key]]));
}

/** Fantrax's games-played column, on every getPlayerStats read whatever the league scores. */
const PLAYED = "GP";

/** One outfielder in one period: his Fantrax id, the matches he played in it, and the asked columns. */
export type PeriodLine = [fantraxId: string, played: number | null, counts: Record<string, number | null>];

/** One period's outfielders who played in it; null when Fantrax refused, so a missing week never reads as a blank. */
function readPeriod(league: string, period: number, keys: readonly string[]): Promise<PeriodLine[] | null> {
  return refusedAs(fetchPoolStats(league, POOL_PAGE_SIZE, undefined, OUTFIELD, period), () => null, (raw) =>
    mapPlayerStats(raw).flatMap((line): PeriodLine[] => {
      const played = line.stats[PLAYED] ?? null;
      return played === 0 ? [] : [[line.fantraxId, played, only(line.stats, keys)]];
    }),
  );
}

const settledPeriod = leagueCache("stats-league-period", readPeriod, () => null, FINAL_REVALIDATE);
const openPeriod = leagueCache("stats-league-period-open", readPeriod, () => null);

/** Every stats-league period begun by `now`, each its outfielders' lines; null when the league is unnamed or a
 *  period could not be read. A finished period is held a day, the open one as long as a page. */
export async function statsLeaguePeriods(keys: readonly string[], now: Date): Promise<PeriodLine[][] | null> {
  const league = STATS_LEAGUE;
  if (league === null) return null;
  const at = now.getTime();
  const begun = (await periodsOf(league)).filter((period) => Date.parse(period.start) <= at);
  const read = await Promise.all(
    begun.map((period) => (Date.parse(period.end) < at ? settledPeriod : openPeriod)(league, period.number, keys)),
  );
  const whole: PeriodLine[][] = [];
  for (const lines of read) {
    if (lines === null) return null;
    whole.push(lines);
  }
  return whole;
}
