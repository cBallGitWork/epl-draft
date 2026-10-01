import { leagueTable as footballTable, signed } from "@epl/core";
import type { PaperTableRow } from "./components/gazette/PaperTable";
import { seasonFixtures } from "./football";
import { leagueTable as draftTable } from "./standings";
import { getLeaguePool } from "./players/pool";
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

/** The draft league, in Fantrax's own order: names and points (Craig, 1 Oct 2026). */
export async function draftRows(mine: string | null): Promise<PaperTableRow[]> {
  const table = await draftTable();
  if ("unavailable" in table) return [];
  return table.map((row) => ({
    key: row.teamId,
    rank: row.rank,
    name: row.teamName,
    played: null,
    detail: null,
    points: row.points,
    yours: row.teamId === mine,
  }));
}

/** How many of the season's scorers the paper prints. A chart, not a database:
 *  ten is what a back page has room for and what a reader scans. */
const SCORERS_SHOWN = 10;

/** What the chart calls a man nobody holds. */
const UNOWNED = "free agent";

/** The season's top scorers, in Fantrax's own season totals off the pool table.
 *
 *  The player's season, not his owner's return: it counts points from the bench and
 *  prices a dual-eligible man at his default position. Never head it as his owner's. */
export async function scorerRows(): Promise<PaperTableRow[]> {
  const pool = await getLeaguePool();
  if ("unavailable" in pool) return [];

  const names = new Map(pool.teamNames);
  return pool.rows
    .flatMap((row) => {
      const points = row.stats?.points ?? null;
      // A player Fantrax has no season figure for is left out rather than
      // printed as a dash: a chart is the ten who scored, not the pool.
      return points === null || points <= 0 ? [] : [{ row, points }];
    })
    .sort((a, b) => b.points - a.points || a.row.entry.player.displayName.localeCompare(b.row.entry.player.displayName))
    .slice(0, SCORERS_SHOWN)
    .map(({ row, points }, at) => ({
      key: row.entry.player.fantraxId,
      rank: at + 1,
      name: row.entry.player.displayName,
      played: null,
      detail:
        row.entry.ownerTeamId === null
          ? UNOWNED
          : (names.get(row.entry.ownerTeamId) ?? UNOWNED),
      points,
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
    detail: signed(row.goalDifference),
    points: row.points,
  }));
}
