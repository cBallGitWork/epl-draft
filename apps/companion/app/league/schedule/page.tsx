import {
  LEAGUE_COMPETITION,
  PLACEHOLDER_ROUNDS,
  type CompetitionTie,
  groupTies,
  leagueTies,
  periodPairings,
  seededTies,
} from "@epl/core";
import Nothing from "../../components/shell/Nothing";
import LeagueShell from "../Shell";
import RoundHeader from "./RoundHeader";
import Tie from "./Tie";
import { getSchedule, type ScheduleRound } from "./schedule";
import { liveScores } from "../../scoreboard";
import { myTeamId } from "../../session";
import { teamBadges } from "../../standings";
import { HEAD_PLATE } from "@/app/desk";
import FantraxSilent from "../../components/shell/FantraxSilent";

// The season ahead: every round the league still has to play, in gameweek order,
// across every competition being played on it. Fantrax's schedule is the league;
// the cup and the playoff are ours, declared in `league/competitions.ts`, which
// is also where the note saying they are a placeholder comes from.
//
// **No controls, and that is the change** — Craig, 5 Sep 2026: *"Dont show all
// the grey arrows here, just show all fixtures for the league itself. CM rows
// etc."* The three dropdowns were a round picker, a competition filter and a team
// picker, and they made a fixture list into something you navigate. A schedule is
// a thing you scroll: `cm9900/24.jpg`'s own Schedule tab is one list with a
// scrollbar down the side, and the reference has no filter control anywhere in
// it.
//
// What each control cost to remove, so the trade is on the record rather than in
// a commit message:
//
//   the ROUND picker    nothing. Every round is on the page now, in order, and
//                       the one being played is at the top of it.
//   the COMPETITION     nothing. `groupTies` already gives each competition its
//                       own headed block, so filtering to one was hiding the
//                       other rather than finding it.
//   the TEAM picker     one view, which moved rather than went. A team's whole
//                       season is on that team's own Fixtures tab
//                       (`/squad/[teamId]/fixtures`), which is where a reader
//                       looking for one team already is, and which draws it with
//                       the same `Season` component off the same `seasonRows`.
//
// **Current and future, and nothing finished** (Craig, 31 Aug). Results is the
// archive; a fixture list that also holds last month is a fixture list you have
// to navigate rather than read. The round in play stays here, because it is not
// finished and because its scores are the reason anyone opens this on a Saturday.
//
// The page speaks gameweeks and never periods. Both were on screen, they are the
// same number all season, and printing one number under two names asks a reader
// to work out whether they are the same thing.

// Must match `PAGE_REVALIDATE` in the app's config. Next analyses this statically, so
// it cannot be imported — change both together. (PLATFORM_NOTES records why.)
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
  // Finished rounds are Results' now. `status`, which is the round's LABEL and
  // is the right question here — "has this round's football finished" — rather
  // than `started`, which asks whether a ball has been kicked and would drop the
  // round in play, the one round this page most exists for.
  const rounds = read.rounds.filter((round) => round.status !== "finished");

  if (read.rounds.length > 0 && rounds.length === 0) {
    return (
      <LeagueShell current="schedule" teams={info.teams.length}>
        <Nothing title="Season complete" code={`${read.rounds.length} gameweeks, all finished`}>
          Every round {info.name} plays has been played. They are all on Results.
        </Nothing>
      </LeagueShell>
    );
  }

  if (rounds.length === 0) {
    return (
      <LeagueShell current="schedule">
        <Nothing
          title="No calendar to read"
          code={`${info.scoringPeriods.length} rounds, 0 gameweeks`}
        >
          Fantrax describes the league&apos;s rounds but none of them holds a gameweek, so there is
          no round to show its fixtures against.
        </Nothing>
      </LeagueShell>
    );
  }

  const [mine, crests] = await Promise.all([myTeamId(info.teams), teamBadges()]);

  // Fantrax's own rank, for CM's blue block. Off the table this page already
  // reads to seed the knockout brackets, so it costs nothing.
  const places = new Map(table.map((row) => [row.teamId, row.rank] as const));

  // **Only the rounds that have started, and there is at most one.** Fantrax
  // answers for any period asked, so a page showing the whole season forward
  // would otherwise spend thirty-odd requests on totals that are all nought.
  // `started` and not `status`: the round in play is exactly the one whose
  // scores are worth a request.
  const scoring = rounds.filter((round) => round.started);
  const boards = await Promise.all(scoring.map((round) => liveScores(round.period)));
  const points = new Map<number, Map<string, number | null>>(
    scoring.map((round, at) => [
      round.period,
      new Map([...boards[at].scores].map(([team, score]) => [team, score.points])),
    ]),
  );
  const refused = boards.find((board) => board.refused !== null)?.refused ?? null;

  /** Every tie in one gameweek: Fantrax's pairings and our declared knockouts. */
  const tiesIn = (at: ScheduleRound): CompetitionTie[] => [
    ...leagueTies(periodPairings(info.matchups, info.teams, at.period)),
    ...seededTies(PLACEHOLDER_ROUNDS, table, at.gameweek),
  ];

  return (
    <LeagueShell current="schedule">
      {refused === null ? null : (
        <p className="px-3 text-2xs text-faint">
          Fantrax&apos;s scoreboard is not answering, so there are no points to show. The fixtures
          below are still right. <span className="numeric">{refused}</span>
        </p>
      )}

      {/* The season in CM's scrolling box on a desk; a phone scrolls the page, or the box's foot sits under the rail. */}
      <div className="cm-scroll cm-scroll-y flex flex-col gap-4 lg:max-h-[42rem] lg:overflow-y-auto">
        {rounds.map((round) => (
          <Round
            key={round.period}
            round={round}
            ties={tiesIn(round)}
            points={points.get(round.period) ?? EMPTY}
            badges={crests}
            places={places}
            mine={mine}
          />
        ))}
      </div>
    </LeagueShell>
  );
}

/** One gameweek: its deadline, and every tie being played on it. */
function Round({
  round,
  ties,
  points,
  badges,
  places,
  mine,
}: {
  round: ScheduleRound;
  ties: CompetitionTie[];
  points: Map<string, number | null>;
  badges: Map<string, string>;
  places: Map<string, number>;
  mine: string | null;
}) {
  if (ties.length === 0) return null;

  return (
    <section className="flex flex-col gap-1">
      <RoundHeader round={round} />
      {groupTies(ties).map((group) => (
        <div key={`${group.competition.id}-${group.round ?? ""}`} className="flex flex-col">
          {/* The competition's own head, in the chrome face, the way CM captions
              a block inside a panel. The LEAGUE's block is unheaded: a schedule
              of which nine rows in ten are the league would be a column of one
              repeated word, and the two lines a cup round adds are exactly the
              rows that need naming. */}
          {group.competition.id === LEAGUE_COMPETITION.id && group.round === null ? null : (
            <h3 className={`${HEAD_PLATE} text-3xs font-bold uppercase`}>
              {group.round === null
                ? group.competition.name
                : `${group.competition.name} · ${group.round}`}
              <span className="pl-2 font-normal opacity-70">Placeholder draw</span>
            </h3>
          )}
          <ul className="cm-rows flex flex-col">
            {group.ties.map((tie, at) => (
              <li key={`${tie.home.label}-${tie.away.label}-${at}`}>
                <Tie
                  tie={tie}
                  points={points}
                  badges={badges}
                  places={places}
                  round={round}
                  mine={mine}
                />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}

/** Hoisted rather than written inline: a `new Map()` in the render would be a
 *  fresh object per round, and every round but the one in play wants the same
 *  empty one. */
const EMPTY: Map<string, number | null> = new Map();
