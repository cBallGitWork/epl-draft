import ScoutShell from "../Shell";
import Skeleton from "../../components/shell/Skeleton";
import { PRESSABLE } from "../BoardControls";
import { StackWaiting } from "../[fantraxId]/Waiting";

// Compare, waiting on two live Fantrax profiles: its own skeleton, or Next would hand it the board's.

export default function Loading() {
  return (
    <ScoutShell current="analysis">
      {/* The two search boxes at their real sizes, inert: a skeleton that submits would reload a loading page. */}
      <div className="grid grid-cols-2 gap-1.5 lg:gap-3" aria-busy>
        {["a", "b"].map((side) => (
          <div key={side} className="flex min-w-0 gap-1.5">
            <div className="cm-panel min-h-11 min-w-0 flex-1 lg:min-h-9" />
            <span className={PRESSABLE}>Find</span>
          </div>
        ))}
      </div>

      {/* The bar, at `CompareBar`'s own height. */}
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
