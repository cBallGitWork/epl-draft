import { LEAGUE_COMPETITION, type CompetitionTie, type TieSide, leads } from "@epl/core";
import type { ScheduleRound } from "./schedule";
import ScoreRow from "../../components/shell/ScoreRow";
import { LABEL } from "@/app/desk";
import Absent from "@/app/components/shell/Absent";
import { matchupHref } from "../routes";

// One tie as CM's results row (`shell/ScoreRow`): a fixture to come prints its code, never 0:0, and the whole row is one
// link. Only the league's own ties open a board: the head-to-head route knows nothing of cups.

export default function Tie({
  tie,
  points,
  places,
  round,
  mine,
}: {
  tie: CompetitionTie;
  /** Each side's Fantrax total for the gameweek, by team id. */
  points: Map<string, number | null>;
  /** Each team's place in the table, for CM's blue block (`placings`). */
  places: Map<string, string>;
  round: ScheduleRound;
  mine: string | null;
}) {
  const home = scoreOf(tie.home, points);
  const away = scoreOf(tie.away, points);
  const yours = mine !== null && (tie.home.team?.teamId === mine || tie.away.team?.teamId === mine);

  // A winner only at full time (`gameweekStatus`).
  const settled = round.status === "finished";

  // A fixture to come opens its board too (Craig, 5 Sep 2026); a tie with nobody in it yet opens nothing.
  const opens =
    tie.competition.id === LEAGUE_COMPETITION.id &&
    tie.home.team !== null &&
    tie.away.team !== null;
  // Opened on the reader's side when he is in it, else the home side.
  const opensOn = yours ? mine : tie.home.team?.teamId;

  return (
    <ScoreRow
      home={side(tie.home, places, mine, settled && leads(away, home))}
      away={side(tie.away, places, mine, settled && leads(home, away))}
      score={round.started ? { home: figure(home), away: figure(away) } : null}
      pending={<span className={LABEL}>{tie.code ?? "v"}</span>}
      href={opens && opensOn !== undefined ? matchupHref(opensOn, round.gameweek) : undefined}
    />
  );
}

function scoreOf(side: TieSide, points: Map<string, number | null>): number | null {
  return side.team === null ? null : (points.get(side.team.teamId) ?? null);
}

/** A dash, never a nought: no number is not nothing scored (DESIGN §7). */
function figure(value: number | null) {
  return value === null ? <Absent /> : value;
}

function side(seat: TieSide, places: Map<string, string>, mine: string | null, lost: boolean) {
  return {
    name: seat.label,
    place: seat.team === null ? null : (places.get(seat.team.teamId) ?? null),
    mine: seat.team !== null && seat.team.teamId === mine,
    lost,
  };
}
