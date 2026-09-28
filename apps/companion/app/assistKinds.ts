import { unstable_cache } from "next/cache";
import {
  type AssistKinds,
  FantraxError,
  OUTFIELD,
  POOL_PAGE_SIZE,
  fetchLeagueInfo,
  fetchPoolStats,
  isUnmapped,
  mapAssistKinds,
  mapLeagueInfo,
  mapPlayerStats,
  periodGameweeks,
} from "@epl/core";
import { ASSIST_KINDS_REVALIDATE } from "./config";
import { seasonKickoffs } from "./football";
import { orRefusal } from "./refusals";
import { bridge } from "./squads";
import recorded from "../../../data/leagues/recorded.json";

// The stats league's typed fantasy assists for a gameweek, keyed by FPL code. Outfield only: the
// keepers' table carries no kinds. Nothing, never a throw, when the league is unnamed or silent.

/** The league recorded under the `stats` role, listing every column at no points so the served
 *  league need not. Named in data, as `npm run stats` names it, so both read the same league. */
const STATS_LEAGUE = recorded.leagues.find((league) => league.key === recorded.stats)?.leagueId ?? null;

/** A league's own periods; the stats league's calendar need not be the served league's. The league
 *  is an argument, so it is in the cache key by construction. */
const periodsOf = unstable_cache(
  async (league: string) => {
    const raw = await orRefusal(fetchLeagueInfo(league));
    return raw instanceof FantraxError ? [] : mapLeagueInfo(raw).scoringPeriods;
  },
  ["league-periods"],
  { revalidate: ASSIST_KINDS_REVALIDATE },
);

/** One period's kinds in a league, as entries, since a Map does not survive the cache. */
const kindsOf = unstable_cache(
  async (league: string, period: number): Promise<[number, AssistKinds][]> => {
    const raw = await orRefusal(fetchPoolStats(league, POOL_PAGE_SIZE, undefined, OUTFIELD, period));
    if (raw instanceof FantraxError) return [];
    return mapAssistKinds(mapPlayerStats(raw)).flatMap(({ fantraxId, kinds }) => {
      const entry = bridge[fantraxId];
      return entry === undefined || isUnmapped(entry) ? [] : [[entry.fplCode, kinds]];
    });
  },
  ["assist-kinds"],
  { revalidate: ASSIST_KINDS_REVALIDATE },
);

export async function roundAssistKinds(gameweek: number | null): Promise<Map<number, AssistKinds>> {
  if (gameweek === null || STATS_LEAGUE === null) return new Map();
  try {
    const [periods, kickoffs] = await Promise.all([periodsOf(STATS_LEAGUE), seasonKickoffs()]);
    const period = periodGameweeks(periods, kickoffs).find((p) => p.gameweeks.includes(gameweek))?.period;
    return new Map(period === undefined ? [] : await kindsOf(STATS_LEAGUE, period));
  } catch {
    return new Map();
  }
}
