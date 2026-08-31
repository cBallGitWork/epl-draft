import PageHeader from "../components/shell/PageHeader";
import Skeleton from "../components/shell/Skeleton";

// The pool, waiting on Fantrax's 533 KB of stats.
//
// The search box is real and works from the first frame: it is a GET form to
// this same route, so a reader who came here to find one player can type his
// name before the other six hundred have arrived. The status and position chips
// are the league's own vocabulary, read off the pool, so those are blocks.

export default function Loading() {
  return (
    <div aria-busy className="flex flex-col gap-3">
      <PageHeader title="Players" sub={<Skeleton width="10rem" height="0.75rem" />} />

      <form action="/players" className="flex gap-1.5">
        <input
          name="q"
          placeholder="Find a player"
          aria-label="Find a player"
          className="min-h-11 min-w-0 flex-1 border border-line bg-surface px-3 text-base"
        />
        <button
          type="submit"
          className="min-h-11 border border-line px-3 text-sm font-medium hover:bg-raised"
        >
          Find
        </button>
      </form>

      <div className="flex flex-wrap gap-1.5">
        <Skeleton width="7rem" height="2.75rem" />
        <Skeleton width="6rem" height="2.75rem" />
        <Skeleton width="4rem" height="2.75rem" />
      </div>

      {/* The table's own row: a 32px mark on his club's colour, then his name.
          Out through the gutter like the real one, so the rows are the same
          width they will be. */}
      <div
        style={{ marginInline: "calc(var(--page-gutter) * -1)", paddingInline: "var(--page-gutter)" }}
      >
        {Array.from({ length: 8 }, (_, at) => (
          // Two bars, because the real row is two lines — his name over his
          // club — and a skeleton that draws one is a box the row pushes out of
          // the way when it lands. `min-h-[3.25rem]` was tuned to the row's old
          // 52px and went stale the moment `.cm-row` relaxed the desk; the shape
          // tracks it and a number cannot. The circle takes `--row-portrait`,
          // which is the portrait's own size at whichever width this is.
          <div key={at} className="cm-row flex min-h-11 items-center gap-2.5 border-b border-line/60">
            <Skeleton width="var(--row-portrait)" height="var(--row-portrait)" circle />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <Skeleton width="40%" height="0.875rem" />
              <Skeleton width="22%" height="0.6875rem" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
