import { isResolved, leagueTable as footballTable } from "@epl/core";
import type { PaperTableRow } from "./components/gazette/PaperTable";
import { seasonFixtures } from "./football";
import { leagueScorers } from "./scoreboard";
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

/** How many of the round's scorers the paper prints. A chart, not a database:
 *  ten is what a back page has room for and what a reader scans. */
const SCORERS_SHOWN = 10;

/** The round's top scorers, in Fantrax's own points.
 *
 *  **Fantrax's number, priced at the slot the man was filed in.** The pool's
 *  `FPts` and the team stats table both price a player at his default
 *  position, so a dual-eligible man filed deeper is under-priced there —
 *  probed 31 Aug, Saka on 6 in the stats table against the 8 his owner
 *  actually got. The live-scoring payload is the one surface that answers what
 *  a man was worth to the manager who owns him, so it is the one this reads.
 *
 *  **Only once the football has started.** A priced man is a man in somebody's
 *  eleven, and naming them before the deadline would publish sixteen lineups
 *  (`leagueScorers` carries the same warning). */
export async function scorerRows(
  period: number | null,
  underway: boolean,
): Promise<PaperTableRow[]> {
  if (period === null || !underway) return [];
  const squads = await getLeagueSquads();
  if (!("period" in squads)) return [];

  // fantraxId → the man, and the manager holding him. From the resolved
  // rosters, so the name comes through the bridge and nothing is name-matched.
  const named = new Map(
    squads.period.teams.flatMap((team) =>
      team.players
        .filter(isResolved)
        .map((man) => [man.slot.fantraxId, { name: man.player.name, owner: team.teamName }] as const),
    ),
  );

  return (await leagueScorers(period))
    .flatMap((scorer) => {
      const man = named.get(scorer.fantraxId);
      // A man we cannot name is left out rather than printed as an id: the
      // bridge is allowed to miss, and a chart of numbers beside blanks is
      // worse than a shorter chart.
      return man === undefined || scorer.points <= 0 ? [] : [{ ...scorer, ...man }];
    })
    .sort((a, b) => b.points - a.points || a.name.localeCompare(b.name))
    .slice(0, SCORERS_SHOWN)
    .map((scorer, at) => ({
      key: scorer.fantraxId,
      rank: at + 1,
      name: scorer.name,
      played: null,
      detail: scorer.owner,
      points: scorer.points,
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
