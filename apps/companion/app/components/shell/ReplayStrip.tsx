import { replayAt } from "../../clock";
import { londonDayAndDate, londonTime } from "../../londonTime";

/** What the app is pretending it is, whenever `REPLAY_AT` is set.
 *
 *  DESIGN §7's provenance rule, applied to a whole screen rather than to a
 *  figure: under a replay every number on every tab is a reconstruction, and a
 *  LIVE dot on a Tuesday is the one claim nobody could check from a screenshot.
 *
 *  Red as INK and no colour plate, deliberately: `--color-bad` is the doubt slot
 *  and this is a doubt about everything below it, while a plated bar would read
 *  as chrome the product owns. Nothing draws when the app is simply running
 *  today, which is every deployed build. */
export default function ReplayStrip() {
  const at = replayAt();
  if (at === null) return null;

  return (
    <div
      role="status"
      className="flex min-h-9 items-center justify-center gap-2 bg-raised px-[var(--page-gutter)] text-2xs font-bold uppercase text-bad"
    >
      <span>Replay</span>
      <span className="numeric opacity-80">
        {londonDayAndDate(at)} · {londonTime(at)}
      </span>
      <span className="opacity-60">not live</span>
    </div>
  );
}
