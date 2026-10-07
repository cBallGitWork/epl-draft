import {
  COMPETITION_NAME,
  LEAGUE_COMPETITION,
  LEAGUE_NAME,
  type Club,
  type CompetitionTie,
  type Fixture,
  type LiveTeamScore,
  groupTies,
} from "@epl/core";
import ScoreRow from "../components/shell/ScoreRow";
import Section from "../components/shell/Section";
import FootballRow from "./FootballRow";
import Absent from "@/app/components/shell/Absent";
import { matchupHref } from "@/app/league/routes";

// Both competitions in Championship Manager's results row, the football first (Craig, 21 Sep 2026).

/** One league or cup tie; a side not yet drawn has no id or link and prints its label. */
function DraftRow({
  tie,
  scores,
  places,
  mine,
  gameweek,
}: {
  tie: CompetitionTie;
  scores: Map<string, LiveTeamScore>;
  /** Each manager's place in our table, by team id: CM's blue block. */
  places: Map<string, number>;
  mine: string | null;
  gameweek: number;
}) {
  const home = pointsOf(tie.home.team?.teamId, scores);
  const away = pointsOf(tie.away.team?.teamId, scores);
  const yours = mine !== null && (tie.home.team?.teamId === mine || tie.away.team?.teamId === mine);
  const opensOn = yours ? mine : tie.home.team?.teamId;
  // Only league ties open a board: the head-to-head route reads Fantrax's schedule,
  // so a cup tie would open those two teams' league match instead.
  const opens = tie.competition.id === LEAGUE_COMPETITION.id && opensOn !== undefined;

  return (
    <ScoreRow
      home={side(tie, "home", places, mine)}
      away={side(tie, "away", places, mine)}
      // No `pending`: a fantasy total has no kick-off, and a missing one prints the dash.
      score={{ home: figure(home), away: figure(away) }}
      // No tail: a fantasy tie has no minute, and the accent edge and name already mark yours.
      href={opens ? matchupHref(opensOn, gameweek) : undefined}
    />
  );
}

export function Scores({
  ties,
  scores,
  places,
  clubPlaces,
  mine,
  fixtures,
  clubs,
  now,
  gameweek,
}: {
  ties: readonly CompetitionTie[];
  scores: Map<string, LiveTeamScore>;
  /** Our league's table, by team id. */
  places: Map<string, number>;
  /** The real one, by club id. */
  clubPlaces: Map<number, number>;
  mine: string | null;
  fixtures: readonly Fixture[];
  clubs: Map<number, Club>;
  now: boolean;
  gameweek: number;
}) {
  return (
    <>
      {/* Headed, so the rows name their competition (Craig, 21 Sep 2026). */}
      <Section title={COMPETITION_NAME}>
        <ul className="cm-rows">
          {fixtures.map((f) => (
            <li key={f.id}>
              <FootballRow fixture={f} clubs={clubs} places={clubPlaces} now={now} />
            </li>
          ))}
        </ul>
      </Section>
      {/* Nothing with no draft, schedule or Fantrax answer; the football above needs none of them.
          The league's full name, not `LEAGUE_COMPETITION.name` (Craig, 21 Sep 2026). */}
      {groupTies(ties).map((group) => (
        <Section
          key={`${group.competition.id}-${group.round ?? ""}`}
          title={
            group.competition.id === LEAGUE_COMPETITION.id
              ? LEAGUE_NAME
              : group.round === null
                ? group.competition.name
                : `${group.competition.name} · ${group.round}`
          }
        >
          <ul className="cm-rows">
            {group.ties.map((tie, at) => (
              <li key={`${tie.home.label}-${tie.away.label}-${at}`}>
                <DraftRow
                  tie={tie}
                  scores={scores}
                  places={places}
                  mine={mine}
                  gameweek={gameweek}
                />
              </li>
            ))}
          </ul>
        </Section>
      ))}

    </>
  );
}

/** One side of a tie in the row's vocabulary; a seat not yet drawn has no place. */
function side(tie: CompetitionTie, at: "home" | "away", places: Map<string, number>, mine: string | null) {
  const seat = tie[at];
  return {
    name: seat.label,
    place: seat.team === null ? null : (places.get(seat.team.teamId) ?? null),
    mine: seat.team !== null && seat.team.teamId === mine,
  };
}

function pointsOf(teamId: string | undefined, scores: Map<string, LiveTeamScore>) {
  return teamId === undefined ? null : (scores.get(teamId)?.points ?? null);
}

/** Absence, never a nought — a total Fantrax has not given us is not a nil
 *  (DESIGN §7). */
function figure(points: number | null) {
  return points === null ? <Absent /> : points;
}
