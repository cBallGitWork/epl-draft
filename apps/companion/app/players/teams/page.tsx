import BoardKey from "../../components/league/BoardKey";
import { clubStats } from "@epl/core";
import ScoutShell from "../Shell";
import TeamBoard from "./TeamBoard";
import { TEAM_COLUMNS, sortedTeams, teamColumn } from "./columns";
import { teamRows } from "./teamRows";
import { clubSeasons } from "./clubSeasons";
import { footballNow, seasonFixtures } from "../../football";
import { lastValue } from "../routes";

// Data › Teams: the twenty clubs' football, shots to cards (Craig, 30 Sep 2026: "this page should be more pure
// stats, chances created, shots etc, errors"). The Planner owns the fixtures.

export const revalidate = 30;

export default async function TeamsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const asked = await searchParams;
  const sort = teamColumn(lastValue(asked.sort));
  const descending = (lastValue(asked.dir) ?? (sort.rank === "high" ? "desc" : "asc")) === "desc";

  const [seasons, fixtures, snapshot] = await Promise.all([clubSeasons(), seasonFixtures(), footballNow()]);
  const squads = new Map(clubStats(fixtures, snapshot.clubs, snapshot.players).map((club) => [club.clubId, club.squad]));
  const rows = teamRows(snapshot.clubs, seasons, squads);

  return (
    <ScoutShell current="teams">
      <TeamBoard rows={sortedTeams(rows, sort, descending)} sort={sort} descending={descending} />
      <BoardKey entries={TEAM_COLUMNS.map((column) => ({ label: column.head, title: column.title }))} />
    </ScoutShell>
  );
}
