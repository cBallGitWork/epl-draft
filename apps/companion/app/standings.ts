import {
  FANTRAX_LEAGUE_ID,
  FantraxError,
  type StandingsRow,
  fetchStandingsPage,
  mapStandings,
} from "@epl/core";
import { leagueCache } from "./leagueCache";
import { orRefusal, tell } from "./refusals";
import type { Unavailable } from "./refusals";
import { shortTeamNames } from "./teamNames";

// The standings page Fantrax draws for its own site, read for the table. The
// fxea array has no points column, and three for a win lives here.
//
// **And the page is now the WHOLE source.** The fxea array was read alongside it
// from 29 Aug for exactly one column, `gamesBack`, which is the one thing the
// page does not publish. On 31 Aug the table was redrawn as a football one and
// games-back went with the rest of the Americanisms, so the second GET went too:
// one provider call per cache window here, down from two, and one fewer thing
// that can fail on the way to a table.

/** The table, and the refusal if there was one. */
const read = leagueCache("standings-page",
  async (): Promise<{ table: StandingsRow[]; refused: string | null }> => {
    const raw = await orRefusal(fetchStandingsPage(FANTRAX_LEAGUE_ID));
    if (raw instanceof FantraxError) return { table: [], refused: tell(raw) };
    return { table: mapStandings(raw), refused: null };
  },
  (error) => ({ table: [], refused: tell(error) }),
);

/** The table, or the reason there isn't one.
 *
 *  An empty table and an unreachable one are different states and only one of
 *  them is a problem: our real league answers a table with no rows in it every
 *  day until 10 Oct. Nothing on this table is computed from our side, so there
 *  is no stale copy to fall back on and the refusal has to be carried. */
export async function leagueTable(): Promise<StandingsRow[] | Unavailable> {
  const { table, refused } = await read();
  return refused === null ? shortTeamNames(table) : { unavailable: refused };
}
