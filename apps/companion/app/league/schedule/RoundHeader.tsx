import type { ScheduleRound } from "./schedule";
import { londonDate, londonTime } from "../../londonTime";

// A round's own line: when lineups lock, and where the football has got to.
//
// The deadline and not the first kickoff, because the deadline is the only time
// on this page a manager has to act on. Fifteen minutes earlier than the
// kickoff, derived by `locksAt` in one place so this and the paper's masthead
// cannot print different times.
//
// A round the league gave no roster period for falls back to the kickoff and
// says so, rather than labelling a kickoff as a deadline — those are different
// claims and only one of them is a thing to be late for.

export default function RoundHeader({ round }: { round: ScheduleRound }) {
  const at = round.deadline ?? round.kickoff;

  return (
    // **On the plate Results already uses for the same job** (Craig, 5 Sep 2026:
    // "league/schedule - deadline rows missing grey etc"). This was bare text
    // over the photograph while its opposite number on Results — the gameweek a
    // block of scorelines sits under — was a `cm-bevel` run at `h-7`. One list
    // of ties, two ways of heading a block of them; `groundfit` could not see it
    // because the panel around them is translucent and technically a ground.
    //
    // `HEAD_PLATE`'s height and the chrome face, so this strip, the column heads
    // and Results' own head are one object at one size.
    <div className="cm-bevel flex h-7 items-center justify-between gap-3 px-1.5 font-chrome text-2xs font-bold">
      <span>
        <span className="uppercase">
          {round.deadline === null ? "First kickoff" : "Deadline"}
        </span>
        {at === null ? (
          " not yet dated"
        ) : (
          <span className="numeric font-normal">
            {" "}
            {londonDate(at)} · {londonTime(at)}
          </span>
        )}
      </span>
      <Status round={round} />
    </div>
  );
}

/** Live is the one thing on this page that moves, so it is the one thing that
 *  gets colour and motion. A round still to come says nothing: the date beside
 *  it has already said it. */
function Status({ round }: { round: ScheduleRound }) {
  if (round.status === "live") {
    // **No `--color-live` here** — the strip is a light plate now and a plate
    // owns its ink (DESIGN §2). Their red measures 1.39:1 on it, which is the
    // failure `sweep` caught twice today on the same mistake. The dot still
    // carries the colour, because a 6px mark is not text and WCAG measures text.
    return (
      <span className="flex items-center gap-1.5 uppercase">
        <span className="live-dot" />
        Live
      </span>
    );
  }

  return round.status === "finished" ? (
    <span className="font-normal uppercase opacity-70">Full time</span>
  ) : null;
}
