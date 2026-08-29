import {
  FANTRAX_LEAGUE_ID,
  FantraxError,
  type StandingsRow,
  fetchStandings,
  fetchStandingsPage,
  mapStandings,
  mapTeamBadges,
} from "@epl/core";
import { leagueCache } from "./leagueCache";
import { orRefusal, tell } from "./refusals";
import type { Unavailable } from "./refusals";

// The standings page Fantrax draws for its own site, read once for the two
// things printed off it: the table and the badges.
//
// The page leads, and that is the point of the file. The table used to come off
// the fxea array and the badges off this page, so `/league` asked Fantrax for its
// standings twice per window to draw one screen from two payloads that disagreed
// about which was the source. The array does not carry the column the table is
// read for: it has no points, and three for a win lives here.
//
// Its own module because four surfaces want a piece of it — the table, the
// schedule's bracket seeding, the matchups board and the schedule page's badges
// — and a read hidden inside any one of them is one the other three cannot reach
// (CODE_RULES §1).
//
// **The fxea array came back on 29 Aug, for one column and no more.** It carries
// `gamesBack` and the page does not, so the two are read together and merged in
// the mapper. It is the smallest payload Fantrax serves — one short object per
// team — and it rides the same cache entry, so this is one extra GET per window
// rather than one per reader. Its failure costs that column and nothing else:
// the table is built from the page, and a refusal here arrives as an empty array
// the mapper already models.

/** Both halves, and the refusal if there was one. Entries rather than a `Map`:
 *  a cache round trip serialises, and a `Map` does not survive it. */
const read = leagueCache("standings-page",
  async (): Promise<{
    table: StandingsRow[];
    badges: [string, string][];
    refused: string | null;
  }> => {
    const [raw, records] = await Promise.all([
      orRefusal(fetchStandingsPage(FANTRAX_LEAGUE_ID)),
      orRefusal(fetchStandings(FANTRAX_LEAGUE_ID)),
    ]);
    if (raw instanceof FantraxError) return { table: [], badges: [], refused: tell(raw) };
    return {
      table: mapStandings(raw, records instanceof FantraxError ? [] : records),
      badges: mapTeamBadges(raw).map((badge) => [badge.teamId, badge.url]),
      refused: null,
    };
  },
);

/** The table, or the reason there isn't one.
 *
 *  An empty table and an unreachable one are different states and only one of
 *  them is a problem: our real league answers a table with no rows in it every
 *  day until 10 Oct. Nothing on this table is computed from our side, so there
 *  is no stale copy to fall back on and the refusal has to be carried. */
export async function leagueTable(): Promise<StandingsRow[] | Unavailable> {
  const { table, refused } = await read();
  return refused === null ? table : { unavailable: refused };
}

/** Badge URLs by team id.
 *
 *  The refusal is swallowed here rather than carried, unlike the table above:
 *  `TeamBadge` already draws the manager's initial when there is no URL, which
 *  is the same answer this failure wants. A missing score and a missing picture
 *  are not the same kind of absence. */
export async function teamBadges(): Promise<Map<string, string>> {
  return new Map((await read()).badges);
}
