import {
  type CompetitionTie,
  cupTies,
  leagueTies,
  periodPairings,
  seededIn,
} from "@epl/core";
import Nothing from "../../components/shell/Nothing";
import LeagueShell from "../Shell";
import Round, { EMPTY } from "./Round";
import { getSchedule, type ScheduleRound } from "./schedule";
import { liveScores } from "../../scoreboard";
import { myTeamId } from "../../session";
import FantraxSilent from "../../components/shell/FantraxSilent";
import { placings } from "../placings";
import ScoreboardDown from "../ScoreboardDown";

// Every gameweek not yet finished (Craig, 31 Aug: finished ones are Results'), every competition on it; the cups are
// ours (`league/cups/declared.ts`). No controls (Craig, 5 Sep 2026): a schedule is scrolled, and one team's season
// is its Fixtures tab. Gameweeks, never periods.

export const revalidate = 30;

export default async function SchedulePage() {
  const read = await getSchedule();

  if ("unavailable" in read) {
    return (
      <LeagueShell current="schedule">
        <FantraxSilent code={read.unavailable}>
          The schedule is part of the league&apos;s own description of itself, and we cannot read it
          right now.
        </FantraxSilent>
      </LeagueShell>
    );
  }

  const { info, table } = read;
  // `status`, not `started`: the round in play stays, the finished ones are Results'.
  const rounds = read.rounds.filter((round) => round.status !== "finished");

  if (read.rounds.length > 0 && rounds.length === 0) {
    return (
      <LeagueShell current="schedule" teams={info.teams.length}>
        <Nothing title="Season complete" code={`${read.rounds.length} gameweeks, all finished`}>
          Every gameweek {info.name} plays has been played. They are all on Results.
        </Nothing>
      </LeagueShell>
    );
  }

  if (rounds.length === 0) {
    return (
      <LeagueShell current="schedule">
        <Nothing
          title="No calendar to read"
          code={`${info.scoringPeriods.length} scoring periods, 0 gameweeks`}
        >
          Fantrax describes the league&apos;s scoring periods but none of them holds a gameweek, so
          there is no gameweek to show its fixtures against.
        </Nothing>
      </LeagueShell>
    );
  }

  const mine = await myTeamId(info.teams);

  // Each side's place, for CM's blue block.
  const places = placings(table);

  // Scores only for a round that has started, at most one: Fantrax answers every period, the rest with noughts.
  const scoring = rounds.filter((round) => round.started);
  const boards = await Promise.all(scoring.map((round) => liveScores(round.period)));
  const points = new Map<number, Map<string, number | null>>(
    scoring.map((round, at) => [
      round.period,
      new Map([...boards[at].scores].map(([team, score]) => [team, score.points])),
    ]),
  );
  const refused = boards.find((board) => board.refused !== null)?.refused ?? null;

  /** Every tie in one gameweek: Fantrax's pairings and our cups. */
  const tiesIn = (at: ScheduleRound): CompetitionTie[] => [
    ...leagueTies(periodPairings(info.matchups, info.teams, at.period)),
    ...cupTies(info.teams.length, at.gameweek),
  ];

  return (
    <LeagueShell current="schedule">
      {refused === null ? null : (
        <ScoreboardDown refused={refused}>The fixtures below are still right.</ScoreboardDown>
      )}

      {/* The season in CM's scrolling box on a desk; a phone scrolls the page, or the box's foot sits under the rail. */}
      <div className="cm-scroll cm-scroll-y flex flex-col gap-8 lg:max-h-[42rem] lg:overflow-y-auto">
        {rounds.map((round) => (
          <Round
            key={round.period}
            round={round}
            ties={tiesIn(round)}
            points={points.get(round.period) ?? EMPTY}
            places={places}
            mine={mine}
            note={seeding(round.gameweek)}
          />
        ))}
      </div>
    </LeagueShell>
  );
}

/** A cup seeded on this gameweek's points says so under its fixtures. */
function seeding(gameweek: number) {
  const cup = seededIn(gameweek);
  return cup === undefined
    ? undefined
    : { title: `${cup.name} · Seeding`, text: "Every team's points this gameweek set the seeds." };
}
