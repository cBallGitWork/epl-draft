import ScoutShell from "../Shell";
import Skeleton from "../../components/shell/Skeleton";
import { PRESSABLE } from "../BoardControls";
import { StackWaiting } from "../[fantraxId]/Waiting";

// Compare, waiting on two live Fantrax profiles.
//
// **Without this file the route wore the BOARD's skeleton**, because
// `players/loading.tsx` is the parent segment's and Next hands a child segment
// its parent's loading UI. So every load of this screen opened on a frame that
// said the Players tab was current, captioned itself "Player Stats", and drew
// twenty columns of a directory — a skeleton describing a different screen,
// which is the one failure a skeleton exists to prevent. Caught by looking at a
// screenshot taken while the server was still compiling.
//
// **The real shell, with the real view.** `current="analysis"` and the real
// caption, so the bar, the strip and the panel are on screen and correct before
// a read has landed — the same rule `players/loading` and `league/loading` set.
//
// The wait is two uncached `getPlayerProfile` calls, which is the slowest thing
// on the screen and the reason this matters: it is on show for as long as
// Fantrax takes.

export default function Loading() {
  return (
    <ScoutShell current="analysis" title="Compare" rows={0}>
      {/* The two search boxes, at the real sizes and in the real order, because
          a frame whose controls move when the answer lands is a layout that
          jumps. They are not real forms here — a skeleton that submits would
          navigate to a page that is already loading. */}
      <div className="grid grid-cols-2 gap-1.5 lg:gap-3" aria-busy>
        {["a", "b"].map((side) => (
          <div key={side} className="flex min-w-0 gap-1.5">
            <div className="cm-panel min-h-11 min-w-0 flex-1 lg:min-h-9" />
            <span className={PRESSABLE}>Find</span>
          </div>
        ))}
      </div>

      {/* The bar, at the height it will be — `CompareBar`'s own `min-h-20`
          / `lg:min-h-28`, which is the tallest thing on the screen and so the
          one worth holding open. */}
      <div className="flex min-h-20 items-center gap-2.5 bg-surface px-2.5 lg:min-h-28" aria-busy>
        <Skeleton width="3.5rem" height="3.5rem" />
        <Skeleton width="45%" height="1.25rem" />
      </div>

      {/* The figures: fourteen rows is what the ledger draws for two outfielders (`rates.ts`). */}
      <div className="mx-auto flex w-full max-w-sm flex-col" aria-busy>
        {Array.from({ length: 14 }, (_, at) => (
          <div key={at} className="cm-row flex min-h-8 items-center justify-between gap-3 border-b border-line/60 px-1">
            <Skeleton width="2.5rem" height="0.875rem" />
            <Skeleton width="4rem" height="0.75rem" />
            <Skeleton width="2.5rem" height="0.875rem" />
          </div>
        ))}
      </div>

      <StackWaiting />
    </ScoutShell>
  );
}
