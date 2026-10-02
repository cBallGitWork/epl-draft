import {
  FantraxError,
  KEEPER,
  OUTFIELD,
  POOL_PAGE_SIZE,
  fetchPoolStats,
  fplCodeOf,
  mapPlayerStats,
  mapPoolStats,
  mapStatSheet,
} from "@epl/core";
import { SCORING_DAY_REVALIDATE } from "./config";
import { leagueCache } from "./leagueCache";
import { orRefusal } from "./refusals";
import { SCORING_LEAGUE } from "./scoring";
import { bridge } from "./squads";

// One London day in the scoring league's own counts, by FPL code: a club plays once a day, so it is his match.

/** One man's day: the letter his points are priced at, and the league's count in each category it lists. */
export interface LeagueDayLine {
  position: string | null;
  counts: Record<string, number | null>;
}

/** Every man who did anything that day, as entries since a Map does not survive the cache; null when Fantrax would not say. */
export const scoringDay = leagueCache(
  "scoring-day",
  async (day: string): Promise<[number, LeagueDayLine][] | null> => {
    if (SCORING_LEAGUE === null) return null;
    const season = await orRefusal(fetchPoolStats(SCORING_LEAGUE, 1));
    const byDate = season instanceof FantraxError ? null : mapPoolStats(season).byDate;
    if (byDate === null) return null;
    const lines: [number, LeagueDayLine][] = [];
    // One half after the other: Fantrax throttles a burst.
    for (const group of [OUTFIELD, KEEPER]) {
      const raw = await orRefusal(fetchPoolStats(SCORING_LEAGUE, POOL_PAGE_SIZE, byDate, group, undefined, day));
      if (raw instanceof FantraxError) return null;
      const positions = new Map(mapPlayerStats(raw).map((line) => [line.fantraxId, line.defaultPosition]));
      const sheet = mapStatSheet(raw);
      for (const line of sheet.lines) {
        const code = fplCodeOf(bridge, line.fantraxId);
        if (code === null || !line.values.some((value) => (value ?? 0) !== 0)) continue;
        const counts = Object.fromEntries(sheet.columns.map((column, at) => [column.short, line.values[at] ?? null]));
        lines.push([code, { position: positions.get(line.fantraxId) ?? null, counts }]);
      }
    }
    return lines;
  },
  () => null,
  SCORING_DAY_REVALIDATE,
);
