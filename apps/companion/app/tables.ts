import { leagueTable as footballTable } from "@epl/core";
import type { PaperTableRow } from "./components/gazette/PaperTable";
import { seasonFixtures } from "./football";
import { leagueTable as draftTable } from "./standings";
import { getLeagueSquads } from "./squads";

// The paper's two tables, as rows. Both come off reads the page already makes,
// so a back page costs no new request: the draft table is the standings page
// `/league` reads, and the football table is computed from the season fixtures
// the deadline already needs.
//
// The two are kept apart all the way to the component, because they are the
// two layers and their epistemics differ: Fantrax's table is authority we
// quote, and the Premier League's is arithmetic we do under rules that are
// fixed for everyone. Only the second could ever be ours to compute.

/** The draft league, in Fantrax's own order and arithmetic. */
export async function draftRows(mine: string | null): Promise<PaperTableRow[]> {
  const table = await draftTable();
  if ("unavailable" in table) return [];
  return table.map((row) => ({
    key: row.teamId,
    rank: row.rank,
    name: row.teamName,
    played: row.won + row.drawn + row.lost,
    detail: `${row.won}-${row.drawn}-${row.lost}`,
    points: row.points,
    yours: row.teamId === mine,
  }));
}

/** The Premier League, computed from finished fixtures. */
export async function footballRows(): Promise<PaperTableRow[]> {
  const squads = await getLeagueSquads();
  const clubs = "period" in squads ? squads.snapshot.clubs : [];
  if (clubs.length === 0) return [];

  return footballTable(await seasonFixtures(), clubs).map((row, at) => ({
    key: String(row.clubId),
    // The rank is this table's own, because this table IS the authority for
    // it: nobody else's placing is being quoted.
    rank: at + 1,
    name: row.name,
    played: row.played,
    detail: row.goalDifference > 0 ? `+${row.goalDifference}` : String(row.goalDifference),
    points: row.points,
  }));
}
