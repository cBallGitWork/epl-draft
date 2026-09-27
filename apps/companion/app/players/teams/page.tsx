import BoardKey from "../../components/league/BoardKey";
import { PLANNER_RUN, clubStats, plannerGameweeks, plannerRows, type PlannerView } from "@epl/core";
import ScoutShell from "../Shell";
import FantraxSilent from "../../components/shell/FantraxSilent";
import TeamBoard from "./TeamBoard";
import { TEAM_COLUMNS, sortedTeams, teamColumn } from "./columns";
import { teamRows, type PoolMan } from "./teamRows";
import { getLeaguePool } from "../pool";
import { getPlayerStats } from "../playerStats";
import { footballNow, seasonFixtures } from "../../football";
import { intelStrength } from "../../intel";
import { lastValue } from "../routes";

// Data › Teams: which clubs to buy into. Fantrax's points by club and position, its keepers' figures, our run of
// the next six, and FPL's expected numbers (Craig, 24 Sep 2026: "a team stats section … cm-ify it").

export const revalidate = 30;


export default async function TeamsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const asked = await searchParams;
  const sort = teamColumn(lastValue(asked.sort));
  const descending = (lastValue(asked.dir) ?? (sort.ascending ? "asc" : "desc")) === "desc";

  const [pool, lines, fixtures, snapshot] = await Promise.all([
    getLeaguePool(),
    getPlayerStats(),
    seasonFixtures(),
    footballNow(),
  ]);
  const raw = new Map(lines.map((line) => [line.fantraxId, line.stats]));
  const men: PoolMan[] =
    "unavailable" in pool
      ? []
      : pool.rows.map((row) => ({
          club: row.entry.player.clubCode,
          position: row.entry.player.position,
          owned: row.entry.ownerTeamId !== null,
          points: row.stats?.points ?? null,
          cleanSheets: raw.get(row.entry.player.fantraxId)?.CS ?? null,
          goalsAgainst: raw.get(row.entry.player.fantraxId)?.GA ?? null,
        }));

  const gameweeks = plannerGameweeks(fixtures, PLANNER_RUN);
  const run = (view: PlannerView) =>
    new Map(plannerRows(fixtures, snapshot.clubs, intelStrength, view, gameweeks).map((row) => [row.club.code, row.mean]));
  const season = new Map(clubStats(fixtures, snapshot.clubs, snapshot.players).map((club) => [club.clubId, club.squad]));
  const rows = teamRows(
    snapshot.clubs,
    men,
    season,
    intelStrength.size === 0 ? { attack: new Map(), defence: new Map() } : { attack: run("attack"), defence: run("defence") },
  );

  return (
    <ScoutShell current="teams">
      {"unavailable" in pool ? (
        <FantraxSilent code={pool.unavailable}>
          Fantrax&apos;s points are missing because the pool would not answer; the run and FPL&apos;s figures are
          current.
        </FantraxSilent>
      ) : null}
      <TeamBoard rows={sortedTeams(rows, sort, descending)} sort={sort} descending={descending} />
      <BoardKey entries={TEAM_COLUMNS.map((column) => ({ label: column.head, title: column.title }))} />
    </ScoutShell>
  );
}
