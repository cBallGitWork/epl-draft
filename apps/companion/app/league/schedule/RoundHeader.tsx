import type { ScheduleRound } from "./schedule";
import RoundHead from "../../components/shell/RoundHead";
import { londonDayAndDate, londonTime } from "../../londonTime";

// A round's own line: WHICH gameweek it is, when lineups lock, and where the
// football has got to.
//
// **The gameweek is new, and its absence was the bug** (Craig, 7 Sep 2026:
// *"this doesnt actually show what gameweek it is"*). The strip said DEADLINE
// and a date, which names the moment and not the round — so a reader scrolling
// a season had to count Saturdays to find out where he was, while Results, four
// clicks away, headed every one of its blocks `Gameweek 4`. It is `RoundHead`'s
// now, shared with Results and with the Prem's own fixture lists, so the three
// cannot disagree about what a round is called again.
//
// The deadline and not the first kickoff, because the deadline is the only time
// on this page a manager has to act on. Fifteen minutes earlier than the
// kickoff, derived by `locksAt` in one place so this and the paper's masthead
// cannot print different times.
//
// A round the league gave no roster period for falls back to the kickoff and
// says so, rather than labelling a kickoff as a deadline — those are different
// claims and only one of them is a thing to be late for.
//
// **`londonDayAndDate` and not `londonDate`**: the strip now carries the round's
// name as well as its date, and "Saturday 12 September" spelled out took 60% of
// a 390px plate on its own. "Sat 12 Sep" is the same fact at half the width, and
// it is the shape a fixture list already uses everywhere else.

export default function RoundHeader({ round }: { round: ScheduleRound }) {
  const at = round.deadline ?? round.kickoff;

  return (
    // **On the plate Results already uses for the same job** (Craig, 5 Sep 2026:
    // "league/schedule - deadline rows missing grey etc"). This was bare text
    // over the photograph while its opposite number on Results — the gameweek a
    // block of scorelines sits under — was a `cm-bevel` run at `h-7`. One list
    // of ties, two ways of heading a block of them; `groundfit` could not see it
    // because the panel around them is translucent and technically a ground.
    <RoundHead gameweek={round.gameweek}>
      <span className="flex min-w-0 items-center gap-3">
        <span className="truncate">
          <span>{round.deadline === null ? "First kickoff" : "Deadline"}</span>
          {at === null ? (
            " not yet dated"
          ) : (
            <span className="numeric font-normal normal-case">
              {" "}
              {londonDayAndDate(at)} · {londonTime(at)}
            </span>
          )}
        </span>
        <Status round={round} />
      </span>
    </RoundHead>
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
      <span className="flex shrink-0 items-center gap-1.5">
        <span className="live-dot" />
        Live
      </span>
    );
  }

  return round.status === "finished" ? (
    <span className="shrink-0 font-normal opacity-70">Full time</span>
  ) : null;
}
