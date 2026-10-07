import Skeleton from "../../components/shell/Skeleton";

// The shapes the streamed blocks hold while their reads are in flight: a table, and a stack of rows.

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
