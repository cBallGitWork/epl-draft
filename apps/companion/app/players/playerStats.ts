import {
  FANTRAX_LEAGUE_ID,
  FantraxError,
  KEEPER,
  OUTFIELD,
  type PlayerStatLine,
  POOL_PAGE_SIZE,
  fetchPoolStats,
  mapPlayerStats,
  type RawPlayerStats,
} from "@epl/core";
import { leagueCache } from "../leagueCache";
import { orRefusal } from "../refusals";

// The pool with RAW stats against every name — two reads, one per position
// group, because that is the only way Fantrax answers them.
//
// Without `positionOrGroup` this endpoint returns seven fantasy columns and no
// raw stat at all; with it, eighteen for the outfield and twenty for keepers
// (PLATFORM_NOTES, 1 Sep 2026). The two halves do not overlap — 563 and 83 on
// the day this was written, 646 with zero players in both — so the lists are
// appended rather than merged, which is the difference from the TEAM board where
// both halves describe one squad and their figures add.
//
// An array across the cache boundary, as everything here must be:
// `unstable_cache` round-trips through JSON and a `Map` comes back as `{}` with
// no `.get`, which killed the team board's first cut at render.
//
// Failure is an empty list rather than fatal. One half failing is still a board:
// a screen with only outfielders on it is a worse answer than the full pool and
// a much better one than an error page.

export const getPlayerStats = leagueCache("player-stats", async (): Promise<PlayerStatLine[]> => {
  const [outfield, keepers] = await Promise.all([
    orRefusal(fetchPoolStats(FANTRAX_LEAGUE_ID, POOL_PAGE_SIZE, undefined, OUTFIELD)),
    orRefusal(fetchPoolStats(FANTRAX_LEAGUE_ID, POOL_PAGE_SIZE, undefined, KEEPER)),
  ]);

  return [...lines(outfield), ...lines(keepers)];
});

function lines(raw: unknown): PlayerStatLine[] {
  return raw instanceof FantraxError ? [] : mapPlayerStats(raw as RawPlayerStats);
}
