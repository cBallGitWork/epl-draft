import Skeleton from "../../components/shell/Skeleton";

// One player, waiting on Fantrax.
//
// The portrait is 112px wide at the 1.32 ratio `PlayerImage` draws him in, so
// the heading beside it sits where it will sit — the one measurement on this
// page worth getting right, because everything below it moves if the header
// grows. The blocks under it are the name-and-value rows every profile carries.

export default function Loading() {
  return (
    <div aria-busy className="flex flex-col gap-3">
      <header className="flex items-end gap-3 pt-1">
        <Skeleton width="7rem" height="9.25rem" />
        <div className="flex min-w-0 flex-1 flex-col gap-1.5 pb-1">
          <Skeleton width="80%" height="1.5rem" />
          <Skeleton width="55%" height="0.75rem" />
        </div>
      </header>

      {Array.from({ length: 3 }, (_, at) => (
        <section key={at} className="flex flex-col gap-1">
          <Skeleton width="9rem" height="0.75rem" />
          {Array.from({ length: 3 }, (_, row) => (
            <div
              key={row}
              className="flex min-h-11 items-center border border-line bg-surface px-3"
            >
              <Skeleton width="45%" height="0.875rem" />
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}
