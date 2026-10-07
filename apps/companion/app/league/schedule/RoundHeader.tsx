import type { ScheduleRound } from "./schedule";
import RoundHead from "../../components/shell/RoundHead";
import { londonDayAndDate, londonTime } from "@epl/core";

// A round's line (`RoundHead`): which gameweek, when lineups lock, and where the football is. With no roster
// period it gives the first kickoff and says so: a kickoff is not a deadline.

export default function RoundHeader({ round }: { round: ScheduleRound }) {
  const at = round.deadline ?? round.kickoff;

  return (
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

/** Live in motion, Full time quiet; a round to come says nothing, its date already has. */
function Status({ round }: { round: ScheduleRound }) {
  if (round.status === "live") {
    // No `--color-live` on the light plate (1.39:1); the dot carries the colour, and a 6px mark is not text.
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
