import { replayAt } from "../../clock";
import { londonDayAndDate, londonTime } from "@epl/core";
import { SMALL_CAPS } from "@/app/desk";

/** Says what time the app is pretending it is whenever `REPLAY_AT` is set, and draws nothing otherwise.
 *  Red ink with no plate: `--color-bad` is the doubt slot, and a plated bar would read as chrome. */
export default function ReplayStrip() {
  const at = replayAt();
  if (at === null) return null;

  return (
    <div
      role="status"
      className={`flex min-h-9 items-center justify-center gap-2 bg-raised px-[var(--page-gutter)] ${SMALL_CAPS} text-bad`}
    >
      <span>Replay</span>
      <span className="numeric opacity-80">
        {londonDayAndDate(at)} · {londonTime(at)}
      </span>
      <span className="opacity-60">not live</span>
    </div>
  );
}
