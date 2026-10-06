import { fetchBootstrap, fetchFixtures, fetchLive } from "./fpl/client";
import { buildSnapshot, focusGameweek } from "./fpl/map";
import type { FootballSnapshot } from "./types";

// The app's one entry point to the Premier League: fetch here, map purely in `fpl/map.ts`.

/** The football snapshot for `gameweek`, or for the gameweek in focus (live, or next between rounds) when omitted. */
export async function getFootballSnapshot(gameweek?: number): Promise<FootballSnapshot> {
  const bootstrap = await fetchBootstrap();
  const gw = gameweek ?? focusGameweek(bootstrap).gameweek;

  // Independent reads, fetched together.
  const [fixtures, live] = await Promise.all([
    fetchFixtures(gw),
    // A failed read is null, never `{elements: []}`: "nobody has scored" and "we cannot see" are opposite claims.
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
