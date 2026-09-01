import {
  FANTRAX_LEAGUE_ID,
  FantraxError,
  type CategoryLine,
  fetchSeasonStats,
  mapSeasonStats,
} from "@epl/core";
import { leagueCache } from "../../leagueCache";
import { orRefusal } from "../../refusals";

// The season's category totals, cached like every other league read.
//
// One request answers all twelve categories at once — 52 KB for the whole board
// — so the category the reader picks is a filter over what we already hold and
// never a second trip to Fantrax. Changing the select re-renders; it does not
// re-fetch.
//
// **An ARRAY across the cache boundary, and a Map only after it.**
// `unstable_cache` round-trips its value through JSON, and a `Map` does not
// survive that: it comes back as `{}` with no `.get`, and the page dies with
// `D.get is not a function` at render — a failure the four gates cannot see,
// because it needs a running server and a real read to happen at all. Every
// other cached read in this app returns an array; this was the first to try
// otherwise, and it did not work.
//
// Failure is an empty list rather than fatal: a board with no categories is a
// screen that says so, and the rest of the section still works. That is the same
// bargain `getSeasonResults` strikes one folder over.

/** One category's lines, in a shape that survives JSON. */
export interface CategoryEntry {
  category: string;
  lines: CategoryLine[];
}

const readSeasonStats = leagueCache("season-stats", async (): Promise<CategoryEntry[]> => {
  const raw = await orRefusal(fetchSeasonStats(FANTRAX_LEAGUE_ID));
  if (raw instanceof FantraxError) return [];
  return [...mapSeasonStats(raw)].map(([category, lines]) => ({ category, lines }));
});

/** The categories, keyed for lookup. The Map is built on this side of the cache
 *  because only this side can hold one. */
export async function getSeasonStats(): Promise<Map<string, CategoryLine[]>> {
  const entries = await readSeasonStats();
  return new Map(entries.map((entry) => [entry.category, entry.lines]));
}
