import {
  FANTRAX_LEAGUE_ID,
  FantraxError,
  type StandingsRow,
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
// **And the page is now the WHOLE source.** The fxea array was read alongside it
// from 29 Aug for exactly one column, `gamesBack`, which is the one thing the
// page does not publish. On 31 Aug the table was redrawn as a football one and
// games-back went with the rest of the Americanisms, so the second GET went too:
// one provider call per cache window here, down from two, and one fewer thing
// that can fail on the way to a table.

/** Both halves, and the refusal if there was one. Entries rather than a `Map`:
 *  a cache round trip serialises, and a `Map` does not survive it. */
const read = leagueCache("standings-page",
  async (): Promise<{
    table: StandingsRow[];
    badges: [string, string][];
    refused: string | null;
  }> => {
    const raw = await orRefusal(fetchStandingsPage(FANTRAX_LEAGUE_ID));
    if (raw instanceof FantraxError) return { table: [], badges: [], refused: tell(raw) };
    return {
      table: mapStandings(raw),
      badges: mapTeamBadges(raw).map((badge) => [badge.teamId, badge.url]),
      refused: null,
    };
  },
  (error) => ({ table: [], badges: [], refused: tell(error) }),
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
