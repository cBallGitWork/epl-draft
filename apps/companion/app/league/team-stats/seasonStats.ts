import {
  FANTRAX_LEAGUE_ID,
  type CategoryLine,
  type LeagueSeason,
  fetchSeasonStats,
  mapSeasonStats,
} from "@epl/core";
import { leagueCache } from "../../leagueCache";
import { refusedAs } from "../../refusals";

// The league's own season's category totals, every category in one cached request; a failure is an empty board.
// An ARRAY crosses the cache and a Map is built after it: `unstable_cache` round-trips JSON, and a Map comes back `{}`.

/** One category's lines, in a shape that survives JSON. */
interface CategoryEntry {
  category: string;
  lines: CategoryLine[];
}

const readSeasonStats = leagueCache(
  "season-stats",
  (startDate: string, endDate: string): Promise<CategoryEntry[]> =>
    refusedAs(fetchSeasonStats(FANTRAX_LEAGUE_ID, { startDate, endDate }), () => [], (raw) => [...mapSeasonStats(raw)].map(([category, lines]) => ({ category, lines }))),
  () => [],
);

/** The categories over the league's own days, never the calendar's earlier weeks; none before the league has a season. */
export async function getSeasonStats(season: LeagueSeason | null): Promise<Map<string, CategoryLine[]>> {
  if (season === null) return new Map();
  const entries = await readSeasonStats(season.startDate, season.endDate);
  return new Map(entries.map((entry) => [entry.category, entry.lines]));
}
