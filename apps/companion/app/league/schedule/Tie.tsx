import Link from "next/link";
import { LEAGUE_COMPETITION, type CompetitionTie, type TieSide, leads } from "@epl/core";
import type { ScheduleRound } from "./schedule";
import TeamBadge from "../../components/league/TeamBadge";
import { yoursBorder } from "../../mine";

// One tie, as a scoreline: both sides on one row with the score between them,
// the way a results page has printed a football match for a hundred years.
//
// One row, not two, because a scoreline is one row (Craig, 19 Aug) — and because
// a stack of two makes the reader do the subtraction. The names shrink and never
// wrap; two truncated names beat one row that becomes three.
//
// **Where a tap goes depends on whether the football has happened.** A round
// with football in it has a head-to-head worth opening, and the whole row leads
// to it. A round still to come has no score and no eleven anyone may see, so
// each side leads to its own squad instead — which is the only useful thing
// about a fixture in March.
//
// Only the LEAGUE's own ties open a board. The head-to-head route resolves its
// pairing from Fantrax's league schedule and knows nothing about competitions,
// so tapping a cup tie would land on the league fixture those two happened to
// have that week — a different match, with nothing on screen to say so.

export default function Tie({
  tie,
  points,
  badges,
  round,
  mine,
}: {
  tie: CompetitionTie;
  /** Each side's Fantrax total for the gameweek, by team id. */
  points: Map<string, number | null>;
  /** Each team's badge, by team id. */
  badges: Map<string, string>;
  round: ScheduleRound;
  mine: string | null;
}) {
  const home = scoreOf(tie.home, points);
  const away = scoreOf(tie.away, points);
  const yours = mine !== null && (tie.home.team?.teamId === mine || tie.away.team?.teamId === mine);

  // A fixture that has not been played is a fixture, not a goalless draw.
  // Fantrax answers 0 for every unplayed period, and printing "0 – 0" against a
  // date in March states a result for a match nobody has played — the confident
  // wrong number, wearing the one costume that looks most like an answer.
  const kicked = round.started;

  // Marking a winner needs the football to be over. A half-time lead is not a
  // win, and saying so is the confident wrong answer.
  const settled = round.status === "finished";

  // A cup final between two semi-final winners has nothing to open either.
  const played =
    kicked &&
    tie.competition.id === LEAGUE_COMPETITION.id &&
    tie.home.team !== null &&
    tie.away.team !== null;
  // Opened on the reader's own side when he is in it, else on the home side —
  // the board shows the same head-to-head either way, and a manager reads his
  // own team first.
  const opensOn = yours ? mine : tie.home.team?.teamId;

  const row = (
    <div
      className={`elev flex min-h-14 items-center gap-1 rounded-xl border bg-surface px-2.5 py-2 ${yoursBorder(
        yours,
      )}`}
    >
      <Side
        side={tie.home}
        at="home"
        badges={badges}
        won={settled && leads(home, away)}
        mine={mine}
        linked={!played}
        gameweek={round.gameweek}
      />
      {kicked ? (
        <span className="numeric flex shrink-0 items-baseline gap-1.5 px-1 text-lg font-bold">
          {/* A dash, never a nought: a side we have no number for has not scored
              nothing, we simply do not have it. */}
          <Points value={home} won={settled && leads(home, away)} />
          <span className="text-2xs font-normal text-faint">–</span>
          <Points value={away} won={settled && leads(away, home)} />
        </span>
      ) : (
        <span className="shrink-0 px-3 text-2xs font-bold uppercase tracking-widest text-faint">
          v
        </span>
      )}
      <Side
        side={tie.away}
        at="away"
        badges={badges}
        won={settled && leads(away, home)}
        mine={mine}
        linked={!played}
        gameweek={round.gameweek}
      />
    </div>
  );

  return played && opensOn !== undefined ? (
    <Link
      href={`/league/matchups/${opensOn}?gw=${round.gameweek}`}
      className="block hover:brightness-110"
    >
      {row}
    </Link>
  ) : (
    row
  );
}

function scoreOf(side: TieSide, points: Map<string, number | null>): number | null {
  return side.team === null ? null : points.get(side.team.teamId) ?? null;
}

function Points({ value, won }: { value: number | null; won: boolean }) {
  return (
    <span className={`w-9 text-center ${won ? "text-ink" : "text-muted"}`}>{value ?? "—"}</span>
  );
}

function Side({
  side,
  at,
  badges,
  won,
  mine,
  linked,
  gameweek,
}: {
  side: TieSide;
  /** Badges sit on the outside and names read inward toward the score, so the
   *  away half is the home half mirrored. */
  at: "home" | "away";
  badges: Map<string, string>;
  won: boolean;
  mine: string | null;
  /** Whether this side is its own tap target. False when the whole row already
   *  leads somewhere — a link inside a link is not markup a browser will honour. */
  linked: boolean;
  /** The round this row is about. Carried into the squad link so a tap on a
   *  March fixture opens March's squad, not this week's — without it every row
   *  in the season led to the same fifteen men under today's date. */
  gameweek: number;
}) {
  const yours = side.team !== null && side.team.teamId === mine;
  const body = (
    <>
      <TeamBadge team={side.team} url={side.team === null ? undefined : badges.get(side.team.teamId)} />
      <span
        className={`min-w-0 flex-1 truncate text-sm ${at === "home" ? "text-right" : ""} ${
          side.team === null
            ? "italic text-faint"
            : yours || won
              ? "font-bold text-ink"
              : "font-semibold"
        }`}
      >
        {side.label}
      </span>
    </>
  );

  const classes = `flex min-w-0 flex-1 items-center gap-2 ${
    at === "away" ? "flex-row-reverse" : ""
  }`;

  // Into the squad: a round still to come has no head-to-head worth opening, and
  // the fifteen names are public all week whatever the lineup gate is doing.
  return side.team === null || !linked ? (
    <div className={classes}>{body}</div>
  ) : (
    <Link
      href={`/squad/${side.team.teamId}?gw=${gameweek}`}
      className={`${classes} hover:underline`}
    >
      {body}
    </Link>
  );
}
