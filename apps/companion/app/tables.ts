import { leagueTable as footballTable } from "@epl/core";
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

/** How many of the season's scorers the paper prints. A chart, not a database:
 *  ten is what a back page has room for and what a reader scans. */
const SCORERS_SHOWN = 10;

/** What the chart calls a man nobody holds. */
const UNOWNED = "free agent";

/** The season's top scorers, in Fantrax's own season totals.
 *
 *  **Fantrax's published number, not one of ours.** Their pool table carries a
 *  season `FPts` for every player and comes back ranked by it, so this is the
 *  same figure a manager sees on Fantrax's own player list — which is what a
 *  scorers chart in a paper should be, and it costs nothing: `getLeaguePool`
 *  already reads it for the Players tab.
 *
 *  **It is the player's season, not his owner's return, and the heading says
 *  so.** Two honest numbers differ here and neither is wrong: this one counts
 *  every point a man scored whether or not his manager started him — Bruno
 *  Fernandes tops it on 22 having spent a round on somebody's bench — and it
 *  prices a dual-eligible man at his default position, so a player filed
 *  deeper earned his owner more than this says (probed 31 Aug: Saka 6 here
 *  against the 8 midfield rates paid). What a man was worth to the manager
 *  holding him is the live-scoring number, per period, and that is a different
 *  column for a different day. Never print this one under a heading claiming
 *  it. */
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
    detail: row.goalDifference > 0 ? `+${row.goalDifference}` : String(row.goalDifference),
    points: row.points,
  }));
}
