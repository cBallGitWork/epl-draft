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

// The pool's raw counts, read once per position group because only that way does Fantrax list them. The halves do not
// overlap, so they are appended; an array, since a Map does not survive the cache. A half that refuses is left out.

export const getPlayerStats = leagueCache("player-stats", async (): Promise<PlayerStatLine[]> => {
  const [outfield, keepers] = await Promise.all([
    orRefusal(fetchPoolStats(FANTRAX_LEAGUE_ID, POOL_PAGE_SIZE, undefined, OUTFIELD)),
    orRefusal(fetchPoolStats(FANTRAX_LEAGUE_ID, POOL_PAGE_SIZE, undefined, KEEPER)),
  ]);

  return [...lines(outfield), ...lines(keepers)];
}, () => []);

/** One half's response, mapped, or nothing if that half refused. */
function lines(raw: RawPlayerStats | FantraxError): PlayerStatLine[] {
  return raw instanceof FantraxError ? [] : mapPlayerStats(raw);
}
