import { fetchBootstrap, fetchFixtures, fetchLive } from "./fpl/client";
import { buildSnapshot, focusGameweek } from "./fpl/map";
import type { FootballSnapshot } from "./types";

// The one entry point the app calls to learn what is happening in the Premier
// League. Fetch here, map purely there — the split that keeps `map.ts` testable.

/** Assemble the current football snapshot. Pass `gameweek` to view a specific
 *  round; omit it to follow whatever is live (or next up between rounds). */
export async function getFootballSnapshot(gameweek?: number): Promise<FootballSnapshot> {
  const bootstrap = await fetchBootstrap();
  const gw = gameweek ?? focusGameweek(bootstrap).gameweek;

  // Fixtures and live stats are independent — fetch them together rather than
  // paying two round trips in series on the live path.
  const [fixtures, live] = await Promise.all([
    fetchFixtures(gw),
    // Before a season starts this is `{elements: []}` rather than an error, but a
    // provider hiccup should degrade to "no stats yet", never a blank page.
    fetchLive(gw).catch(() => ({ elements: [] })),
  ]);

  return buildSnapshot({ bootstrap, fixtures, live, fetchedAt: new Date().toISOString() });
}
