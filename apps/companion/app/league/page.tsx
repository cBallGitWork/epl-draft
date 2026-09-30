import ScrollBoard from "../components/league/ScrollBoard";
import { Fragment } from "react";
import { LEAGUE_NAME, defaultDescending, isSortKey, seasonForm, sortRows } from "@epl/core";
import Columns, { COLUMNS } from "./Columns";

import TableRow from "./TableRow";
import { getSeasonResults } from "./schedule/schedule";
import { leagueTable, teamBadges } from "../standings";
import Nothing from "../components/shell/Nothing";
import LeagueShell from "./Shell";
import { readerTeamId } from "../squads";
import { leagueInfo } from "../round";
import { BOARD, MINOR_CAPS } from "@/app/desk";
import FantraxSilent from "../components/shell/FantraxSilent";

// The table. Fantrax computes it — the record, the points and the order are
// theirs, and this page never adds them up itself. Three for a win is a
// commissioner setting, so a table that worked it out here would be right until
// somebody's league paid two.

// Must match `PAGE_REVALIDATE` in the app's config. Next analyses this statically, so
// it cannot be imported — change both together. (PLATFORM_NOTES records why.)
export const revalidate = 30;

/** Next 16 hands these as a Promise, so it is awaited like `params`. */
type Search = Promise<{ sort?: string; dir?: string }>;

export default async function StandingsPage({ searchParams }: { searchParams: Search }) {
  const query = await searchParams;
  // An unknown column falls back to Fantrax's own order rather than throwing:
  // the sort arrives in a URL, and a shared link with a stale column name should
  // still show the table.
  const sort = isSortKey(query.sort) ? query.sort : "rank";
  const descending = query.dir === undefined ? defaultDescending(sort) : query.dir === "desc";

  const [rows, mine, badges, info, results] = await Promise.all([
    leagueTable(),
    readerTeamId(),
    teamBadges(),
    leagueInfo(),
    // The whole season's results in one request, and the only thing on this page
    // that costs a read the table itself did not already make. It is what turns
    // a record into a run: `won-drawn-lost` is a total, and a side on 5-2-3 that
    // won five and then lost three is not the same team as one that lost three
    // and then won five.
    getSeasonResults(),
  ]);
  // Where the season's cut falls, and it is the league's answer rather than
  // ours. Fantrax publishes it — our league is a top four from period 35 — and
  // for as long as nothing read that field the table drew the placeholder
  // bracket's invented top TWO instead.
  //
  // Null is a real answer and not a missing one: the rehearsal league runs no
  // playoff at all, and a table with no cut has no line to draw rather than one
  // at zero.
  const qualify = info?.playoffs?.places ?? null;

  // Empty for every row until Fantrax has settled a round, and empty for a row
  // whose run does not reproduce the record Fantrax published — see
  // `league/form.ts`. Both are a dash rather than a wrong string.
  const form = new Map(
    ("unavailable" in rows ? [] : seasonForm(rows, info?.matchups ?? [], results)).map((team) => [
      team.teamId,
      team.run,
    ]),
  );

  // An empty state keeps the header and the section nav. Without them a reader
  // who lands here during an outage has no way to reach Schedule or Matchups —
  // the page is a dead end rather than a section with nothing in it. Schedule
  // already did this; the table and the matchups board did not.
  if ("unavailable" in rows) {
    return (
      <LeagueShell current="table" teams={info?.teams.length}>
        <FantraxSilent code={rows.unavailable}>
          The table is theirs to keep, and we cannot read it right now. Nothing here is computed
          from our side, so there is no stale copy to fall back on.
        </FantraxSilent>
      </LeagueShell>
    );
  }

  if (rows.length === 0) {
    return (
      <LeagueShell current="table" teams={info?.teams.length}>
        <Nothing title="No table yet" code="getStandings → 0 rows">
          {LEAGUE_NAME} has not drafted yet. A table needs teams in it, and Fantrax has none to
          rank.
        </Nothing>
      </LeagueShell>
    );
  }

  return (
    <LeagueShell current="table" teams={info?.teams.length}>
      {/* The FP column is Fantrax's live total and moves all weekend. This was
          the last points surface with no refresh on it at all: `revalidate`
          bounds how stale the cache may get and pushes nothing to a phone left
          open on the sofa, so the table sat still through a whole afternoon. */}

      {/* Out to the page's edges and back in again, so a table wider than the
          phone scrolls sideways inside its own box instead of scrolling the
          page. The gutter is a variable precisely so the things that break out
          of it cannot drift from it (globals.css). `/players` set this pattern
          and DESIGN §9 signed it off: on a phone the columns Fantrax publishes
          stay reachable rather than being dropped behind a breakpoint. */}
      {/* The panel is `LeagueShell`'s now — every view under this tab strip gets
          the same block, rather than the table carrying a ground of its own. */}
      <ScrollBoard>
        <table className={BOARD}>
          <Columns sort={sort} descending={descending} />
          <tbody>
            {sortRows(rows, sort, descending).map((row) => (
              <Fragment key={row.teamId}>
                <TableRow
                  sort={sort}
                  row={row}
                  badge={badges.get(row.teamId)}
                  mine={row.teamId === mine}
                  form={form.get(row.teamId) ?? []}
                />
                {sort === "rank" && !descending && cut(row.rank, qualify, rows.length) ? (
                  /* The playoff line, drawn across the table under the last
                     qualifying place rather than shaded over the rows above it:
                     a tinted band reads as "these are yours" on the one row a
                     manager is looking for.

                     **Yellow, dashed** — Craig, 31 Aug, copying `cm9900/24.jpg`,
                     which draws exactly this line in exactly this colour under
                     1st place. It was the league's red on the argument that the
                     accent is already spoken for on the row that carries it, by
                     the edge and by the chip. That argument is not wrong; CM's
                     palette simply is not slot-strict here, and a dashed rule
                     fifteen rows from a chip is not the ambiguity DESIGN §3 is
                     guarding against. Recorded rather than done quietly, because
                     it is the accent taking a second meaning on one screen.

                     Absent entirely for a league that declares no playoff, and
                     for a table shorter than the cut — a line under the bottom
                     row states a qualification nobody missed. */
                  <tr aria-hidden>
                    <td colSpan={COLUMNS.length} className="p-0">
                      <span className={`flex items-center gap-2 py-1.5 ${MINOR_CAPS} text-faint`}>
                        <span className="flex-1 border-t border-dashed border-accent/80" />
                        Playoffs
                        <span className="flex-1 border-t border-dashed border-accent/80" />
                      </span>
                    </td>
                  </tr>
                ) : null}
              </Fragment>
            ))}
          </tbody>
        </table>
      </ScrollBoard>
    </LeagueShell>
  );
}

/** Whether the playoff line falls under this row.
 *
 *  Never under the last one: a line beneath the bottom of the table announces a
 *  cut nobody missed. A two-team league whose top two qualify is exactly the
 *  shape that would draw one, and no league we serve is anywhere near it — the
 *  smallest is ten. */
function cut(rank: number, qualify: number | null, teams: number): boolean {
  return qualify !== null && rank === qualify && rank < teams;
}
