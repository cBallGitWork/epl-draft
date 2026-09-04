import Skeleton from "../../components/shell/Skeleton";

// The shapes the streamed blocks leave behind while their reads are in flight.
//
// Both were local functions in the 286-line page this rework replaced; the tabs
// split their callers into separate route files, which is what moved them here.
// They stay a pair rather than one parameterised skeleton: a table and a stack
// of rows are different shapes, and a `variant` prop on a placeholder is the
// generic mechanism CODE_RULES §1 forbids.

/** A ruled head, then rows the height the table's are. */
export function TableWaiting() {
  return (
    <section aria-busy className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3 border-b border-line pb-1">
        <Skeleton width="6rem" height="0.75rem" />
        <Skeleton width="4rem" height="0.75rem" />
      </div>
      <div className="flex flex-col gap-1">
        {Array.from({ length: 4 }, (_, at) => (
          <div key={at} className="flex min-h-7 items-center gap-3">
            <Skeleton width="2rem" height="0.875rem" />
            <Skeleton width="100%" height="0.875rem" />
          </div>
        ))}
      </div>
    </section>
  );
}

/** A ruled head with a figure on the right, then the rows under it. */
export function StackWaiting() {
  return (
    <section aria-busy className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3 border-b border-line pb-1">
        <Skeleton width="7rem" height="0.75rem" />
        <Skeleton width="4.5rem" height="0.875rem" />
      </div>
      <div className="flex flex-col gap-0.5">
        {Array.from({ length: 4 }, (_, at) => (
          <div key={at} className="flex min-h-9 items-center bg-surface px-3">
            <Skeleton width="40%" height="0.875rem" />
          </div>
        ))}
      </div>
    </section>
  );
}
