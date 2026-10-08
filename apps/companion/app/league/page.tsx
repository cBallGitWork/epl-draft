import ScrollBoard from "../components/league/ScrollBoard";
import { Fragment } from "react";
import { LEAGUE_NAME, defaultDescending, isSortKey, seasonForm, sortRows, tableLines } from "@epl/core";
import Columns, { COLUMNS } from "./Columns";

import TableRow from "./TableRow";
import { getSeasonResults } from "./schedule/schedule";
import { leagueTable } from "../standings";
import Nothing from "../components/shell/Nothing";
import LeagueShell from "./Shell";
import { readerTeamId } from "../squads";
import { leagueInfo, readCalendar } from "../round";
import { CutRow } from "../components/league/TableCells";
import { BOARD } from "@/app/desk";
import FantraxSilent from "../components/shell/FantraxSilent";

// The table, Fantrax's: the record, the points and the order are theirs, never added up here.

export const revalidate = 30;

/** Next 16 hands these as a Promise, so it is awaited like `params`. */
type Search = Promise<{ sort?: string; dir?: string }>;

export default async function StandingsPage({ searchParams }: { searchParams: Search }) {
  const query = await searchParams;
  // An unknown column falls back to Fantrax's order, so a stale shared link still shows the table.
  const sort = isSortKey(query.sort) ? query.sort : "rank";
  const descending = query.dir === undefined ? defaultDescending(sort) : query.dir === "desc";

  const [rows, mine, info, results, calendar] = await Promise.all([
    leagueTable(),
    readerTeamId(),
    leagueInfo(),
    // The season's results, for the form guide: a record is a total, a run is an order.
    getSeasonResults(),
    readCalendar(),
  ]);

  // Empty until Fantrax settles a round, and for a run that does not reproduce its record (`league/form.ts`).
  const form = new Map(
    ("unavailable" in rows ? [] : seasonForm(rows, info?.matchups ?? [], results)).map((team) => [
      team.teamId,
      team.run,
    ]),
  );

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

  // Fantrax's playoff count places the semis; the rest is declared in core. No playoff, no lines.
  const lines = tableLines(info?.playoffs?.places ?? null, rows.length);

  return (
    <LeagueShell current="table" teams={info?.teams.length}>
      {/* A table wider than the phone scrolls sideways inside its own box. */}
      <ScrollBoard>
        <table className={BOARD}>
          <Columns sort={sort} descending={descending} />
          <tbody>
            {sortRows(rows, sort, descending).map((row) => (
              <Fragment key={row.teamId}>
                <TableRow
                  sort={sort}
                  row={row}
                  mine={row.teamId === mine}
                  form={form.get(row.teamId) ?? []}
                  calendar={calendar}
                />
                {/* Dashed yellow rules after `cm9900/24.jpg` (Craig, 31 Aug), only in Fantrax's order. */}
                {sort === "rank" && !descending
                  ? lines
                      .filter((line) => line.under === row.rank)
                      .map((line) => (
                        <CutRow key={line.label} span={COLUMNS.length} label={line.label} tone="border-accent/80" />
                      ))
                  : null}
              </Fragment>
            ))}
          </tbody>
        </table>
      </ScrollBoard>
    </LeagueShell>
  );
}
