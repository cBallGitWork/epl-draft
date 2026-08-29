import Skeleton from "../../components/shell/Skeleton";

// The wall of scores, before any of them have come in.
//
// The desk's own furniture is a heading and two ruled blocks, and all of it is
// ours: the titles say which half of the screen is the league and which is the
// football, and neither needs a provider to be true.

export default function Loading() {
  return (
    <div aria-busy className="flex flex-col gap-4">
      <header className="flex items-baseline justify-between gap-3 pt-1">
        <h1 className="text-xl font-bold tracking-tight">The desk</h1>
      </header>

      <Block title="Head-to-head" rows={4} />
      <Block title="The football" rows={10} />
    </div>
  );
}

/** One ruled section of the wall. The desk draws its rows at text height with a
 *  hairline between them rather than as cards, so this is not `SkeletonRows`. */
function Block({ title, rows }: { title: string; rows: number }) {
  return (
    <section className="flex flex-col">
      <h2 className="pb-1 text-2xs font-bold uppercase tracking-widest text-faint">{title}</h2>
      <div className="flex flex-col divide-y divide-line border-y border-line">
        {Array.from({ length: rows }, (_, at) => (
          <div key={at} className="flex items-center gap-2 py-1.5">
            <Skeleton width="55%" height="0.75rem" />
            <Skeleton width="2.5rem" height="0.75rem" />
          </div>
        ))}
      </div>
    </section>
  );
}
