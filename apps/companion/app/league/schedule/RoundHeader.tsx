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
    <div className="flex items-center justify-between gap-3 px-3">
      <span className="text-2xs text-faint">
        <span className="font-bold uppercase">
          {round.deadline === null ? "First kickoff" : "Deadline"}
        </span>
        {at === null ? (
          " not yet dated"
        ) : (
          <span className="numeric">
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
    return (
      <span className="flex items-center gap-1.5 text-2xs font-bold uppercase text-live">
        <span className="live-dot" />
        Live
      </span>
    );
  }

  return round.status === "finished" ? (
    <span className="text-2xs font-bold uppercase text-faint">Full time</span>
  ) : null;
}
