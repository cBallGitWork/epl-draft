import Link from "next/link";
import type { LeagueTeam, LiveTeamScore, PeriodPairing } from "@epl/core";
import Changed from "../shell/Changed";
import ScoreFigure from "../league/ScoreFigure";
import Column from "./Column";

// The splash while football is on.
//
// PRODUCT.md's first principle is that the live number is the interface, and
// this is the front page's version of obeying it: yours enormous at the top,
// every other tie under it at the desk's density, all of it moving. It replaces
// a thin bar that said football was on and made the reader tap to find out
// anything at all.
//
// **It is not the lead, and it never becomes one.** A headline is the one place
// on the page a provisional claim cannot go, so while the round is being played
// the paper reports the score and says nothing about what it means. The written
// lead returns when the football stops.
//
// Figures come through `Changed`, which is the whole reason this is worth
// building rather than linking to: a phone open on the sofa re-renders every
// thirty seconds, and without it a total simply swaps one digit for another with
// nothing to catch the eye.

export default function AsItStands({
  pairings,
  scores,
  mine,
  live,
}: {
  pairings: readonly PeriodPairing[];
  scores: Map<string, LiveTeamScore>;
  /** The reader's team, or null. Theirs sorts out and enlarges; a reader who is
   *  not signed in gets the same eight ties with none of them promoted, which is
   *  a neutral desk rather than an empty one. */
  mine: string | null;
  /** Whether a ball is actually in the air. Drives the present tense and the
   *  dot, and is deliberately narrower than "the round is under way" — the front
   *  page once burned a live dot for sixty-one of a round's seventy-four hours
   *  by asking the wider question. */
  live: boolean;
}) {
  const yours = pairings.find(
    (pairing) => mine !== null && (pairing.home.teamId === mine || pairing.away.teamId === mine),
  );
  const rest = pairings.filter((pairing) => pairing !== yours);

  return (
    <Column
      title={live ? "As it stands" : "The round so far"}
      aside={
        live ? (
          <span className="flex items-center gap-1.5 font-bold uppercase tracking-widest text-live">
            <span className="live-dot" />
            Live
          </span>
        ) : null
      }
    >
      {yours ? <Yours pairing={yours} scores={scores} mine={mine} /> : null}
      {rest.map((pairing) => (
        <Row key={pairing.home.teamId} pairing={pairing} scores={scores} />
      ))}
    </Column>
  );
}

/** Your tie, at the size the principle asks for. Yours on the left whoever
 *  Fantrax calls home: there is no ground, and a manager reads his own score
 *  first. */
function Yours({
  pairing,
  scores,
  mine,
}: {
  pairing: PeriodPairing;
  scores: Map<string, LiveTeamScore>;
  mine: string | null;
}) {
  const [team, opponent] =
    pairing.home.teamId === mine ? [pairing.home, pairing.away] : [pairing.away, pairing.home];
  const points = scores.get(team.teamId)?.points ?? null;
  const other = scores.get(opponent.teamId)?.points ?? null;

  return (
    <Link
      href={`/league/matchups/${team.teamId}`}
      className="flex min-h-11 items-center gap-3 py-3 hover:bg-raised"
    >
      <Side name={team.name} yours />
      <span className="flex shrink-0 items-baseline gap-2">
        <Changed value={points}>
          <ScoreFigure
            points={points}
            other={other}
            className="numeric text-4xl font-bold leading-none"
          />
        </Changed>
        <span className="numeric text-sm text-faint">v</span>
        <Changed value={other}>
          <ScoreFigure
            points={other}
            other={points}
            className="numeric text-4xl font-bold leading-none"
          />
        </Changed>
      </span>
      <Side name={opponent.name} align="end" />
    </Link>
  );
}

/** Every other tie, one line each. The desk's density on the front page,
 *  because eight of these are the rest of the league's afternoon and a reader
 *  wants them at a glance rather than a scroll. */
function Row({ pairing, scores }: { pairing: PeriodPairing; scores: Map<string, LiveTeamScore> }) {
  const home = scores.get(pairing.home.teamId)?.points ?? null;
  const away = scores.get(pairing.away.teamId)?.points ?? null;

  return (
    <Link
      href="/matchday"
      className="flex min-h-11 items-center gap-2 py-1.5 text-sm hover:bg-raised"
    >
      <Side name={pairing.home.name} />
      <span className="numeric shrink-0 font-semibold">
        <Changed value={home}>
          <ScoreFigure points={home} other={away} />
        </Changed>
        <span className="px-1 text-faint">–</span>
        <Changed value={away}>
          <ScoreFigure points={away} other={home} />
        </Changed>
      </span>
      <Side name={pairing.away.name} align="end" />
    </Link>
  );
}

/** A team's name on one side of a scoreline. Only the number ever dims — a name
 *  that dimmed for losing would give the accent a second meaning. */
function Side({
  name,
  yours = false,
  align = "start",
}: {
  name: LeagueTeam["name"];
  yours?: boolean;
  align?: "start" | "end";
}) {
  return (
    <span
      className={`min-w-0 flex-1 truncate ${align === "end" ? "text-right" : ""} ${
        yours ? "font-bold text-accent" : "text-muted"
      }`}
    >
      {name}
    </span>
  );
}
