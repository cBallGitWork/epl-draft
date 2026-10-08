import { unstable_cache } from "next/cache";
import {
  type AssistKinds,
  FantraxError,
  OUTFIELD,
  POOL_PAGE_SIZE,
  fetchPoolStats,
  fplCodeOf,
  mapAssistKinds,
  mapPlayerStats,
  periodGameweeks,
  periodOfGameweek,
} from "@epl/core";
import { ASSIST_KINDS_REVALIDATE } from "./config";
import { seasonKickoffs } from "./football";
import { orRefusal } from "./refusals";
import { bridge } from "./squads";
import { STATS_LEAGUE, periodsOf } from "./statsLeague";

// The stats league's typed fantasy assists for a gameweek, keyed by FPL code. Outfield only: the
// keepers' table carries no kinds. Nothing, never a throw, when the league is unnamed or silent.

/** One period's kinds in a league, as entries, since a Map does not survive the cache. */
const kindsOf = unstable_cache(
  async (league: string, period: number): Promise<[number, AssistKinds][]> => {
    const raw = await orRefusal(fetchPoolStats(league, POOL_PAGE_SIZE, undefined, OUTFIELD, period));
    if (raw instanceof FantraxError) return [];
    return mapAssistKinds(mapPlayerStats(raw)).flatMap(({ fantraxId, kinds }) => {
      const code = fplCodeOf(bridge, fantraxId);
      return code === null ? [] : [[code, kinds]];
    });
  },
  ["assist-kinds"],
  { revalidate: ASSIST_KINDS_REVALIDATE },
);

export async function roundAssistKinds(gameweek: number | null): Promise<Map<number, AssistKinds>> {
  if (gameweek === null || STATS_LEAGUE === null) return new Map();
  try {
    const [periods, kickoffs] = await Promise.all([periodsOf(STATS_LEAGUE), seasonKickoffs()]);
    const period = periodOfGameweek(periodGameweeks(periods, kickoffs), gameweek)?.period;
    return new Map(period === undefined ? [] : await kindsOf(STATS_LEAGUE, period));
  } catch {
    return new Map();
  }
}
