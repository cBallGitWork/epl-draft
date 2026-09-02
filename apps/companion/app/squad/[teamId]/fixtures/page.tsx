import { type CompetitionTie, leagueTies, periodPairings } from "@epl/core";
import TeamShell from "../Shell";
import { teamOr404 } from "../team";
import Season from "../../../league/schedule/Season";
import { getSchedule, getSeasonResults, type ScheduleRound } from "../../../league/schedule/schedule";
import { seasonRows } from "../../../league/schedule/teamSeason";
import { teamBadges } from "../../../standings";

// Every round this side is in, end to end.
//
// **The screen exists already** — `/league/schedule?team=<id>` is this, and has
// been since the schedule grew a team filter. What it did not have was a way in
// from the team: a reader on a squad had to go to League, then Schedule, then
// pick the side out of a select. So this is the same three functions read from
// the other direction, not a second implementation of them.
//
// `seasonRows` and `Season` are imported rather than copied for that reason. If
// the season row ever changes shape it changes in one place, and the two screens
// cannot drift into disagreeing about what a fixture looks like.
//
// **The knockouts are deliberately not here.** The schedule's own view mixes
// Fantrax's pairings with `seededTies`, the placeholder cup and playoff declared
// in `league/competitions.ts` — which are ours rather than the league's, and are
// seeded off a table that has barely any season in it yet. A team's own fixture
// tab shows the fixtures the league actually publishes.

export const revalidate = 30;

export default async function FixturesPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;
  const [team, read] = await Promise.all([teamOr404(teamId), getSchedule()]);

  if ("unavailable" in read) {
    return (
      <TeamShell team={team} title="Fixtures" current="fixtures" empty={["fixtures"]}>
        <section className="cm-panel px-3 py-6">
          <p className="text-center text-2xs text-muted">
            The schedule is part of the league&apos;s own description of itself, and we cannot read
            it right now.
          </p>
        </section>
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
      title="Fixtures"
      current="fixtures"
      empty={rows.length === 0 ? ["fixtures"] : []}
    >
      <section className="cm-panel flex flex-col p-2">
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
