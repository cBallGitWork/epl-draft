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

// The standings page Fantrax draws for its own site, the table's whole source: the fxea array has no points column.

/** The table, and the refusal if there was one. */
const read = leagueCache("standings-page",
  async (): Promise<{ table: StandingsRow[]; refused: string | null }> => {
    const raw = await orRefusal(fetchStandingsPage(FANTRAX_LEAGUE_ID));
    if (raw instanceof FantraxError) return { table: [], refused: tell(raw) };
    return { table: mapStandings(raw), refused: null };
  },
  (error) => ({ table: [], refused: tell(error) }),
);

/** The table, or why not: empty and unreachable differ, and nothing here has a stale copy to fall back on. */
export async function leagueTable(): Promise<StandingsRow[] | Unavailable> {
  const { table, refused } = await read();
  return refused === null ? table : { unavailable: refused };
}
