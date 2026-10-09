import { leagueTable as footballTable, signed } from "@epl/core";
import type { PaperTableRow } from "./components/gazette/PaperTable";
import { footballNow, seasonFixtures } from "./football";
import { leagueTable as draftTable } from "./standings";
import { getLeaguePool } from "./players/pool";

// The paper's two tables as rows, off reads the page already makes, kept apart: Fantrax's we quote, the Premier
// League's we compute under fixed rules.

/** The draft league as its table places it: names and points (Craig, 1 Oct 2026). */
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

/** The season's top scorers by Fantrax's season totals: the player's season, bench points included, never his owner's. */
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

/** The Premier League, computed from finished fixtures: FPL's alone, so a silent Fantrax costs it nothing. */
export async function footballRows(): Promise<PaperTableRow[]> {
  const [{ clubs }, fixtures] = await Promise.all([footballNow(), seasonFixtures()]);
  if (clubs.length === 0) return [];

  return footballTable(fixtures, clubs).map((row, at) => ({
    key: String(row.clubId),
    // This table's own rank: it is the authority.
    rank: at + 1,
    name: row.name,
    played: row.played,
    detail: signed(row.goalDifference),
    points: row.points,
  }));
}
