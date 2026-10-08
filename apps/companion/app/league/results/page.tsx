import { periodPairings } from "@epl/core";
import Nothing from "../../components/shell/Nothing";
import LeagueShell from "../Shell";
import Result from "./Result";
import RoundHead from "../../components/shell/RoundHead";
import { getSchedule, getSeasonResults } from "../schedule/schedule";
import { readerTeamId } from "../../squads";
import FantraxSilent from "../../components/shell/FantraxSilent";
import { placings } from "../placings";

// What has happened: every finished gameweek's head-to-heads, newest first (`cm9900/24.jpg`'s Results tab, Craig, 31 Aug).
// A view of the schedule's two cached reads; it makes no provider call of its own.

export const revalidate = 30;

export default async function ResultsPage() {
  const [schedule, results, mine] = await Promise.all([
    getSchedule(),
    getSeasonResults(),
    // `readerTeamId`: this page has not narrowed the squads itself.
    readerTeamId(),
  ]);

  if ("unavailable" in schedule) {
    return (
      <LeagueShell current="results">
        <FantraxSilent code={schedule.unavailable}>
          The season is theirs to keep, and we cannot read it right now.
        </FantraxSilent>
      </LeagueShell>
    );
  }

  const { info, rounds, table } = schedule;

  // Today's place, for CM's blue block: the app keeps no history of the table.
  const places = placings(table);

  // Every team's total, by period, built once.
  const byPeriod = new Map<number, Map<string, number | null>>();
  for (const result of results) {
    const period = byPeriod.get(result.period) ?? new Map<string, number | null>();
    period.set(result.teamId, result.points);
    byPeriod.set(result.period, period);
  }

  // Finished, not merely started (`gameweekStatus`), and scored: an unscored round is not a round of 0-0 draws.
  const played = rounds
    .filter((round) => round.status === "finished" && byPeriod.has(round.period))
    .reverse();

  if (played.length === 0) {
    return (
      <LeagueShell current="results" teams={info.teams.length}>
        <Nothing title="Nothing played yet" code="no started round has a result">
          {info.name} has results here as soon as a round finishes. A round still being
          played is on Matchups, where its score is meant to move.
        </Nothing>
      </LeagueShell>
    );
  }

  return (
    <LeagueShell current="results" teams={info.teams.length}>
      <div className="flex flex-col gap-3">
        {played.map((round) => (
          <section key={round.period} className="flex flex-col">
            <RoundHead gameweek={round.gameweek} />
            <div className="cm-rows flex flex-col">
              {periodPairings(info.matchups, info.teams, round.period).map((pairing) => (
                <Result
                  key={`${pairing.home.teamId}-${pairing.away.teamId}`}
                  pairing={pairing}
                  points={byPeriod.get(round.period) ?? EMPTY}
                  gameweek={round.gameweek}
                  places={places}
                  mine={mine}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </LeagueShell>
  );
}

/** Satisfies the type: the filter above means it is never reached. */
const EMPTY: Map<string, number | null> = new Map();
