import {
  FANTRAX_LEAGUE_ID,
  FantraxError,
  type CategoryLine,
  fetchSeasonStats,
  mapSeasonStats,
} from "@epl/core";
import { leagueCache } from "../../leagueCache";
import { orRefusal } from "../../refusals";

// The season's category totals, every category in one cached request; a failure is an empty board, not a dead page.
// An ARRAY crosses the cache and a Map is built after it: `unstable_cache` round-trips JSON, and a Map comes back `{}`.

/** One category's lines, in a shape that survives JSON. */
export interface CategoryEntry {
  category: string;
  lines: CategoryLine[];
}

const readSeasonStats = leagueCache("season-stats", async (): Promise<CategoryEntry[]> => {
  const raw = await orRefusal(fetchSeasonStats(FANTRAX_LEAGUE_ID));
  if (raw instanceof FantraxError) return [];
  return [...mapSeasonStats(raw)].map(([category, lines]) => ({ category, lines }));
}, () => []);

/** The categories, keyed for lookup. The Map is built on this side of the cache
 *  because only this side can hold one. */
export async function getSeasonStats(): Promise<Map<string, CategoryLine[]>> {
  const entries = await readSeasonStats();
  return new Map(entries.map((entry) => [entry.category, entry.lines]));
}
