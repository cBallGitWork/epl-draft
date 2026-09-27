import TabEmpty from "../../../components/league/TabEmpty";
import { type CompetitionTie, leagueTies, periodPairings } from "@epl/core";
import TeamShell from "../Shell";
import { teamOr404 } from "../team";
import Season from "../../../league/schedule/Season";
import { getSchedule, getSeasonResults, type ScheduleRound } from "../../../league/schedule/schedule";
import { seasonRows } from "../../../league/schedule/teamSeason";
import { teamBadges } from "../../../standings";
import { PANEL } from "@/app/desk";

// Every round this side is in, end to end.
//
// **This is now the ONLY way to read one team's whole season.** It was the
// second one: `/league/schedule?team=<id>` drew the same view behind a select,
// and that select went on 5 Sep 2026 with the schedule's other two ("Dont show
// all the grey arrows here, just show all fixtures for the league itself"). The
// view moved rather than went, and this is where a reader looking for one team
// already is — a squad's own Fixtures tab, rather than League, then Schedule,
// then picking the side out of a dropdown.
//
// `seasonRows` and `Season` still live under `league/schedule/` because that is
// where the shape belongs; nothing else reads them now.
//
// Cup ties are not here: nobody is drawn into one yet, so no cup fixture can name this team.

// Must match `PAGE_REVALIDATE` in the app's config. Next analyses this statically, so
// it cannot be imported — `scripts/revalidate.test.ts` holds the two together.
export const revalidate = 30;

export default async function FixturesPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId: slug } = await params;
  const [team, read] = await Promise.all([teamOr404(slug), getSchedule()]);
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
  // Every round, finished ones included — unlike the schedule screen, which
  // hands its archive to Results. A team's own fixture list is the season it
  // has had as well as the one it has left; that is what makes it a season
  // rather than a to-do list.
  const tiesIn = (at: ScheduleRound): CompetitionTie[] =>
    leagueTies(periodPairings(info.matchups, info.teams, at.period));

  const [rows, badges] = await Promise.all([
    getSeasonResults().then((results) => seasonRows(read.rounds, tiesIn, results, teamId)),
    teamBadges(),
  ]);

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
          <Season rows={rows} badges={badges} teamId={teamId} />
        )}
      </section>
    </TeamShell>
  );
}
