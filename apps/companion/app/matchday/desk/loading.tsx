import Skeleton from "../../components/shell/Skeleton";
import { GAMEWEEK_HEAD, GAMEWEEK_TITLE, LABEL, PANEL } from "@/app/desk";

// The wall of scores before any have come in; its headings need no provider.

export default function Loading() {
  return (
    <div aria-busy className={PANEL}>
      <header className={GAMEWEEK_HEAD}>
        <h1 className={GAMEWEEK_TITLE}>The desk</h1>
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
      <h2 className={`pb-1 ${LABEL}`}>{title}</h2>
      <div className="flex flex-col divide-y divide-line border-y border-line">
        {Array.from({ length: rows }, (_, at) => (
          <div key={at} className="flex items-center gap-2 py-1">
            <Skeleton width="55%" height="0.75rem" />
            <Skeleton width="2.5rem" height="0.75rem" />
          </div>
        ))}
      </div>
    </section>
  );
}
