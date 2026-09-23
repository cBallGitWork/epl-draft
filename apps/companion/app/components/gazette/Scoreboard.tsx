import Link from "next/link";
import { type LiveTeamScore, type PeriodPairing, pairingInvolves } from "@epl/core";
import { yoursFirst, yoursInk } from "../../mine";
import Changed from "../shell/Changed";
import ScoreFigure from "../league/ScoreFigure";
import { matchupHref } from "@/app/league/routes";

// The round, reduced to a band — except for the one number docs/rules/PRODUCT.md will not
// let shrink.
//
// This used to be `AsItStands`, the splash: yours enormous, everything else at
// desk density, and all journalism suppressed beneath it. The paper leads with
// journalism now — the reversal `docs/ui/gazetta.md` records — so the scores
// become what they are on a real front page: a strip under the masthead, with
// the Live tab one tap away for actually watching.
//
// **While a ball is in the air, your own tie stays at full size above the
// strip.** Principle 1 is that the live number outranks everything on screen,
// including the headline below it, and the first cut of this band set it at
// 12px under a 34px headline — the register warden's finding, and docs/rules/PRODUCT.md
// outranks the look. Between kickoffs the hierarchy is allowed to relax, and
// the full-size row folds back into the strip.
//
// The strip renders only while the round is under way: before the first
// kickoff every total is a legitimate nought, and 0–0 across eight ties would
// be reporting a round nobody has played. Figures come through `Changed`: a
// phone open on the sofa re-renders every thirty seconds, and without it a
// total swaps one digit for another with nothing to catch the eye.

export default function Scoreboard({
  pairings,
  scores,
  mine,
  live,
}: {
  pairings: readonly PeriodPairing[];
  scores: Map<string, LiveTeamScore>;
  /** The reader's team, or null. Theirs sorts first; a reader who is not
   *  signed in gets the same ties with none of them promoted. */
  mine: string | null;
  /** Whether a ball is actually in the air — the dot, the present tense, and
   *  the full-size row. Deliberately narrower than "the round is under way". */
  live: boolean;
}) {
  const ordered = yoursFirst(pairings, (pairing) => pairingInvolves(pairing, mine));
  const yours =
    ordered.length > 0 && pairingInvolves(ordered[0], mine) ? ordered[0] : null;
  const promoted = live && yours !== null;

  return (
    <nav aria-label="The round's scores" className="border-y border-line">
      {promoted && yours !== null ? <Yours pairing={yours} scores={scores} mine={mine} /> : null}
      {/* The scrollbar is hidden because the strip IS a scrollbar of sorts —
          snap points and the cut-off next cell say "more" better than a bar
          under a hairline band would. */}
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

/** Your tie while football is on, set the way a Saturday football paper sets
 *  the match it exists for: the two names stacked, a dotted leader running out
 *  to each figure, and the figures as large as the sheet allows. It is the
 *  Pink's scoreline banner — `WEST HAM ......... 2` — and it is the one thing
 *  on this page unambiguously about YOU.
 *
 *  Yours on top whoever Fantrax calls home: there is no ground here, and a
 *  manager reads his own score first. */
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
      {/* The line a scoreline cannot carry: who is still to come. Absence here
          is "Fantrax did not say", never "nobody left" — the rule three
          screens have already relearned, and the one that decides whether a
          tie is over. */}
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
      {/* `paper-display` and not `font-display`: Archivo Narrow is the FIGURE
          face in both registers (DESIGN §6), and a name set in it would be a
          name wearing a number's clothes. The paper's display type is
          Fraunces, and a scoreline banner is display type. */}
      <span
        className={`paper-display min-w-0 shrink truncate text-2xl font-black leading-none ${
          yoursInk(yours)
        }`}
      >
        {name}
      </span>
      {/* The dotted leader. A border on a growing span rather than a run of
          full stops: it takes exactly the room that is left, at any name
          length, and can never wrap onto a second line. */}
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

/** One tie as a stacked pair. Yours links to your matchup board; the rest to
 *  the Live tab, which owns watching. No hover fill: the paper's links do not
 *  take one anywhere else, and newsprint does not light up. */
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
      href={involved && mine !== null ? matchupHref(mine) : "/matchday"}
      className="flex min-h-11 shrink-0 snap-start flex-col justify-center gap-0.5 border-l border-line px-3 py-1.5 text-xs"
    >
      <SideLine name={pairing.home.name} yours={pairing.home.teamId === mine} points={home} other={away} />
      <SideLine name={pairing.away.name} yours={pairing.away.teamId === mine} points={away} other={home} />
    </Link>
  );
}

/** A name and its figure, the figure flushed right so the tabular digits of
 *  the stacked pair share their units column. Only the number ever dims — a
 *  name that dimmed for losing would give the accent a second meaning. */
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
