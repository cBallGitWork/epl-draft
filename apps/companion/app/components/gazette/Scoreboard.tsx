import Link from "next/link";
import { type LiveTeamScore, type PeriodPairing, pairingInvolves } from "@epl/core";
import { yoursFirst, yoursInk } from "../../mine";
import Changed from "../shell/Changed";
import ScoreFigure from "../league/ScoreFigure";
import { matchupHref } from "@/app/league/routes";
import { LIVE } from "../shell/sections";

// The gameweek's scores as a strip under the masthead; while a ball is in the air your own tie stands above it at full size.
// The caller draws it only once the gameweek is under way: before kickoff every total is a nought.

export default function Scoreboard({
  pairings,
  scores,
  mine,
  live,
}: {
  pairings: readonly PeriodPairing[];
  scores: Map<string, LiveTeamScore>;
  /** The reader's team, or null; theirs sorts first. */
  mine: string | null;
  /** A ball is in the air: the dot, the present tense and the full-size row. */
  live: boolean;
}) {
  const ordered = yoursFirst(pairings, (pairing) => pairingInvolves(pairing, mine));
  const yours =
    ordered.length > 0 && pairingInvolves(ordered[0], mine) ? ordered[0] : null;
  const promoted = live && yours !== null;

  return (
    <nav aria-label="The round's scores" className="border-y border-line">
      {promoted && yours !== null ? <Yours pairing={yours} scores={scores} mine={mine} /> : null}
      {/* No scrollbar: the snap points and the cut-off next cell say "more". */}
      <div
        className={`flex items-stretch overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] snap-x [&::-webkit-scrollbar]:hidden ${promoted ? "border-t border-line" : ""}`}
      >
        <span className="flex shrink-0 items-center gap-1.5 py-1.5 pr-3 font-sans text-3xs font-semibold uppercase tracking-[0.16em]">
          {live ? (
            <>
              <span className="live-dot" />
              <span className="text-live">Live</span>
            </>
          ) : (
            <span className="text-muted">The round</span>
          )}
        </span>
        {(promoted ? ordered.slice(1) : ordered).map((pairing) => (
          <Tie key={pairing.home.teamId} pairing={pairing} scores={scores} mine={mine} />
        ))}
      </div>
    </nav>
  );
}

/** Your tie while football is on, as a Saturday paper's scoreline banner (`WEST HAM ......... 2`), yours on top. */
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
  const yours = scores.get(team.teamId);
  const theirs = scores.get(opponent.teamId);

  return (
    <Link href={matchupHref(team.teamId)} className="flex flex-col py-2">
      <ScoreLine name={team.name} score={yours} other={theirs} yours />
      <ScoreLine name={opponent.name} score={theirs} other={yours} />
      {/* Who is still to come; absence is "Fantrax did not say", never "nobody left". */}
      <span className="pt-1 font-sans text-3xs uppercase tracking-[0.16em] text-faint">
        {toPlayLine(team.name, yours?.toPlay ?? null, opponent.name, theirs?.toPlay ?? null)}
      </span>
    </Link>
  );
}

/** One side of the banner: name, leader, figure. */
function ScoreLine({
  name,
  score,
  other,
  yours = false,
}: {
  name: string;
  score: LiveTeamScore | undefined;
  other: LiveTeamScore | undefined;
  yours?: boolean;
}) {
  const points = score?.points ?? null;

  return (
    <span className="flex items-baseline gap-2">
      {/* `paper-display`, not `font-display`: Archivo Narrow is the figure face, and a name is not a figure. */}
      <span
        className={`paper-display min-w-0 shrink truncate text-2xl font-black leading-none ${
          yoursInk(yours)
        }`}
      >
        {name}
      </span>
      {/* The dotted leader: a border on a growing span, so it fills the room left and never wraps. */}
      <span className="min-w-4 flex-1 translate-y-[-0.25em] border-b border-dotted border-current opacity-40" />
      <Changed value={points}>
        <ScoreFigure
          points={points}
          other={other?.points ?? null}
          className="numeric text-4xl font-bold leading-none"
        />
      </Changed>
    </span>
  );
}

/** "123 3 to play · test2 1 to play", or what can honestly be said of it. */
function toPlayLine(
  name: string,
  yours: number | null,
  otherName: string,
  theirs: number | null,
): string {
  const side = (label: string, count: number | null) =>
    count === null ? null : `${label} ${count} to play`;
  const parts = [side(name, yours), side(otherName, theirs)].filter((part) => part !== null);
  return parts.length === 0 ? "Fantrax has not said who is left" : parts.join(" · ");
}

/** One tie as a stacked pair: yours links to your matchup board, the rest to the Live tab. */
function Tie({
  pairing,
  scores,
  mine,
}: {
  pairing: PeriodPairing;
  scores: Map<string, LiveTeamScore>;
  mine: string | null;
}) {
  const home = scores.get(pairing.home.teamId)?.points ?? null;
  const away = scores.get(pairing.away.teamId)?.points ?? null;
  const involved = pairingInvolves(pairing, mine);

  return (
    <Link
      href={involved && mine !== null ? matchupHref(mine) : LIVE}
      className="flex min-h-11 shrink-0 snap-start flex-col justify-center gap-0.5 border-l border-line px-3 py-1.5 text-xs"
    >
      <SideLine name={pairing.home.name} yours={pairing.home.teamId === mine} points={home} other={away} />
      <SideLine name={pairing.away.name} yours={pairing.away.teamId === mine} points={away} other={home} />
    </Link>
  );
}

/** A name and its figure, flushed right so the stacked pair's digits line up; only the number dims. */
function SideLine({
  name,
  yours,
  points,
  other,
}: {
  name: string;
  yours: boolean;
  points: number | null;
  other: number | null;
}) {
  return (
    <span className="flex items-baseline gap-2">
      <span className={`w-24 truncate ${yours ? "font-bold text-accent" : "text-muted"}`}>
        {name}
      </span>
      <span className="ml-auto">
        <Changed value={points}>
          <ScoreFigure points={points} other={other} className="numeric font-semibold" />
        </Changed>
      </span>
    </span>
  );
}
