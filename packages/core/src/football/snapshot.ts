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
    // Before a season starts FPL answers `{elements: []}`, which is not an error.
    // A read that actually fails becomes null rather than that same empty shape:
    // one gameweek in four hundred people are watching, "nobody has scored" and
    // "we cannot see" are opposite claims, and the snapshot has to carry which.
    fetchLive(gw).catch(() => null),
  ]);

  return buildSnapshot({
    bootstrap,
    fixtures,
    live,
    gameweek: gw,
    fetchedAt: new Date().toISOString(),
  });
}
