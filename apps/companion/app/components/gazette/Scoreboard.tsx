import Link from "next/link";
import type { LiveTeamScore, PeriodPairing } from "@epl/core";
import Changed from "../shell/Changed";
import ScoreFigure from "../league/ScoreFigure";

// The round, reduced to a band.
//
// This used to be `AsItStands`, the splash: yours enormous, everything else at
// desk density, and all journalism suppressed beneath it. The paper leads with
// journalism at all times now — the reversal `docs/ui/gazetta.md` records — so
// the scores become what they are on a real front page: a strip under the
// masthead that says the football is on and where it stands, with the Live tab
// one tap away for actually watching it.
//
// Eight ties in one horizontally scrolling row, stacked-pair cells, yours
// first. It renders only while the round is under way: before the first
// kickoff every total is a legitimate nought, and a strip reading 0–0 across
// eight ties would be reporting a round nobody has played.
//
// Figures come through `Changed`: a phone open on the sofa re-renders every
// thirty seconds, and without it a total swaps one digit for another with
// nothing to catch the eye.

export default function Scoreboard({
  pairings,
  scores,
  mine,
  live,
}: {
  pairings: readonly PeriodPairing[];
  scores: Map<string, LiveTeamScore>;
  /** The reader's team, or null. Theirs sorts first; a reader who is not
   *  signed in gets the same eight ties with none of them promoted. */
  mine: string | null;
  /** Whether a ball is actually in the air — the dot and the present tense,
   *  deliberately narrower than "the round is under way". */
  live: boolean;
}) {
  const yours = pairings.find(
    (pairing) => mine !== null && (pairing.home.teamId === mine || pairing.away.teamId === mine),
  );
  const ordered = yours ? [yours, ...pairings.filter((pairing) => pairing !== yours)] : [...pairings];

  return (
    <nav aria-label="The round's scores" className="border-y border-line">
      {/* The scrollbar is hidden because the strip IS a scrollbar of sorts —
          snap points and the cut-off ninth cell say "more" better than a bar
          under a hairline band would. */}
      <div className="flex items-stretch overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] snap-x [&::-webkit-scrollbar]:hidden">
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
        {ordered.map((pairing) => (
          <Tie
            key={pairing.home.teamId}
            pairing={pairing}
            scores={scores}
            mine={mine}
          />
        ))}
      </div>
    </nav>
  );
}

/** One tie as a stacked pair. Yours links to your matchup board; the rest to
 *  the Live tab, which owns watching. */
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
  const involved = pairing.home.teamId === mine || pairing.away.teamId === mine;

  return (
    <Link
      href={involved && mine !== null ? `/league/matchups/${mine}` : "/matchday"}
      className="flex min-h-11 shrink-0 snap-start flex-col justify-center gap-0.5 border-l border-line px-3 py-1.5 text-xs hover:bg-raised"
    >
      <SideLine name={pairing.home.name} yours={pairing.home.teamId === mine} points={home} other={away} />
      <SideLine name={pairing.away.name} yours={pairing.away.teamId === mine} points={away} other={home} />
    </Link>
  );
}

/** A name and its figure. Only the number ever dims — a name that dimmed for
 *  losing would give the accent a second meaning. */
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
      <Changed value={points}>
        <ScoreFigure points={points} other={other} className="numeric ml-auto font-semibold" />
      </Changed>
    </span>
  );
}
