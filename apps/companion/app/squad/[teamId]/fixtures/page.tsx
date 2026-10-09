import TabEmpty from "../../../components/league/TabEmpty";
import { type CompetitionTie, leagueTies, periodPairings } from "@epl/core";
import TeamShell from "../Shell";
import { leagueTeams } from "../team";
import Season from "../../../league/schedule/Season";
import { getSchedule, getSeasonResults, type ScheduleRound } from "../../../league/schedule/schedule";
import { seasonRows } from "../../../league/schedule/teamSeason";
import { PANEL } from "@/app/desk";

// Every gameweek this side plays, played and to come: the only view of one team's whole season.
// Cup ties are not here: nobody is drawn into one yet, so no cup fixture can name this team.

export const revalidate = 30;

export default async function FixturesPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId: slug } = await params;
  const [{ team }, read] = await Promise.all([leagueTeams(slug), getSchedule()]);
  // The id the slug resolved to: `me` is a front door and not a team.
  const teamId = team.teamId;

  if ("unavailable" in read) {
    return (
      <TeamShell team={team} current="fixtures" empty={["fixtures"]}>
        <TabEmpty>The schedule is part of the league&apos;s own description of itself, and we cannot read
            it right now.</TabEmpty>
      </TeamShell>
    );
  }

  const { info } = read;
  // Finished gameweeks included, unlike the schedule screen, which hands them to Results.
  const tiesIn = (at: ScheduleRound): CompetitionTie[] =>
    leagueTies(periodPairings(info.matchups, info.teams, at.period));

  const rows = seasonRows(read.rounds, tiesIn, await getSeasonResults(), teamId);

  return (
    <TeamShell
      team={team}
      current="fixtures"
      empty={rows.length === 0 ? ["fixtures"] : []}
    >
      <section className={PANEL}>
        {rows.length === 0 ? (
          <p className="px-1 py-6 text-center text-2xs text-muted">
            Fantrax has paired {team.teamName} with nobody this season.
          </p>
        ) : (
          <Season rows={rows} teamId={teamId} />
        )}
      </section>
    </TeamShell>
  );
}
