import { unstable_cache } from "next/cache";
import {
  type AssistKinds,
  FANTRAX_STATS_LEAGUE_ID,
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

// The stats league's typed fantasy assists for a gameweek, keyed by FPL code. Outfield only: the
// keepers' table carries no kinds. Nothing, never a throw, when the league is unset or silent.

/** The stats league's own periods; its calendar need not be the served league's. */
const statsPeriods = unstable_cache(
  async () => {
    const raw = await orRefusal(fetchLeagueInfo(FANTRAX_STATS_LEAGUE_ID));
    return raw instanceof FantraxError ? [] : mapLeagueInfo(raw).scoringPeriods;
  },
  ["stats-league-periods", FANTRAX_STATS_LEAGUE_ID],
  { revalidate: ASSIST_KINDS_REVALIDATE },
);

/** One period's kinds as entries, since a Map does not survive the cache. */
const periodKinds = unstable_cache(
  async (period: number): Promise<[number, AssistKinds][]> => {
    const raw = await orRefusal(fetchPoolStats(FANTRAX_STATS_LEAGUE_ID, POOL_PAGE_SIZE, undefined, OUTFIELD, period));
    if (raw instanceof FantraxError) return [];
    return mapAssistKinds(mapPlayerStats(raw)).flatMap(({ fantraxId, kinds }) => {
      const entry = bridge[fantraxId];
      return entry === undefined || isUnmapped(entry) ? [] : [[entry.fplCode, kinds]];
    });
  },
  ["stats-league-assist-kinds", FANTRAX_STATS_LEAGUE_ID],
  { revalidate: ASSIST_KINDS_REVALIDATE },
);

export async function roundAssistKinds(gameweek: number | null): Promise<Map<number, AssistKinds>> {
  if (gameweek === null || FANTRAX_STATS_LEAGUE_ID === "") return new Map();
  try {
    const [periods, kickoffs] = await Promise.all([statsPeriods(), seasonKickoffs()]);
    const period = periodGameweeks(periods, kickoffs).find((p) => p.gameweeks.includes(gameweek))?.period;
    return new Map(period === undefined ? [] : await periodKinds(period));
  } catch {
    return new Map();
  }
}
