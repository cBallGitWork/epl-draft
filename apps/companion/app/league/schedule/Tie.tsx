import { LEAGUE_COMPETITION, type CompetitionTie, type TieSide, leads } from "@epl/core";
import type { ScheduleRound } from "./schedule";
import ScoreRow from "../../components/shell/ScoreRow";
import { LABEL } from "@/app/desk";
import Absent from "@/app/components/shell/Absent";
import { matchupHref } from "../routes";

// One tie, as Championship Manager's results row.
//
// The row itself is `components/shell/ScoreRow`, shared with the Live tab and
// with Results — its docblock carries the measurements off `craig/01-evening-
// results.jpg`. What is left here is the three decisions a SCHEDULE has to make
// that a live scoreline does not.
//
// **A fixture that has not been played is a fixture, not a goalless draw.**
// Fantrax answers 0 for every unplayed period, and printing `0:0` against a date
// in March states a result for a match nobody has played — the confident wrong
// number, wearing the one costume that looks most like an answer. The row prints
// its `pending` mark instead.
//
// **Where a tap goes depends on whether the football has happened.** A round with
// football in it has a head-to-head worth opening and the whole row leads to it.
// A round still to come has no score and no eleven anyone may see, so the row is
// not a control at all — which is also what stops thirty-eight of them being
// thirty-eight tap targets on one screen.
//
// Only the LEAGUE's own ties open a board. The head-to-head route resolves its
// pairing from Fantrax's league schedule and knows nothing about competitions, so
// tapping a cup tie would land on the league fixture those two happened to have
// that week — a different match, with nothing on screen to say so.
//
// **Each side no longer links to its own squad, and that is a loss taken on
// purpose.** It was two anchors inside a row that also wanted to be one, which is
// why the row could not be a link and why `tapfit` kept finding 26px targets in a
// 56px row. A squad is two taps away through the head-to-head, and the schedule's
// question is "who plays whom", not "who is in their fifteen".

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
  /** Each team's place in the table, for CM's blue block. Fantrax's own rank. */
  places: Map<string, number>;
  round: ScheduleRound;
  mine: string | null;
}) {
  const home = scoreOf(tie.home, points);
  const away = scoreOf(tie.away, points);
  const yours = mine !== null && (tie.home.team?.teamId === mine || tie.away.team?.teamId === mine);

  // Marking a winner needs the football to be over — see `gameweekStatus` in
  // core. A half-time lead is not a win.
  const settled = round.status === "finished";

  // **A fixture still to come opens its match page too** (Craig, 5 Sep 2026:
  // "non played matches in draft should go to a match page too"). It was gated
  // on `round.started` because an unplayed round has no score and no eleven
  // anyone may see — both true, and neither a reason to make the row dead: the
  // head-to-head draws the two squads with the lineup gate closed and says so,
  // which is the honest version of "who am I playing in March" and a better
  // answer than nothing happening when you tap.
  //
  // A cup final between two semi-final winners still opens nothing, because
  // there is nobody in it yet.
  const opens =
    tie.competition.id === LEAGUE_COMPETITION.id &&
    tie.home.team !== null &&
    tie.away.team !== null;
  // Opened on the reader's own side when he is in it, else on the home side —
  // the board shows the same head-to-head either way, and a manager reads his
  // own team first.
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

/** A dash, never a nought: a side we have no number for has not scored nothing,
 *  we simply do not have it (DESIGN §7). */
function figure(value: number | null) {
  return value === null ? <Absent /> : value;
}

function side(seat: TieSide, places: Map<string, number>, mine: string | null, lost: boolean) {
  return {
    name: seat.label,
    place: seat.team === null ? null : (places.get(seat.team.teamId) ?? null),
    mine: seat.team !== null && seat.team.teamId === mine,
    lost,
  };
}
