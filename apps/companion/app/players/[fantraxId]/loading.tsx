import BackPlate from "../../components/shell/BackPlate";
import Skeleton from "../../components/shell/Skeleton";
import { POOL } from "../routes";

// One player, waiting on Fantrax, for all four of his views: only the bar and the tab strip they share, at the
// shell's own heights.

export default function Loading() {
  return (
    <div aria-busy className="flex flex-col gap-2">
      {/* The plated bar. */}
      <div className="flex items-stretch">
        <BackPlate fallback={POOL} />
        <div className="min-w-0 flex-1">
          <Skeleton width="100%" height="2.75rem" />
        </div>
      </div>

      {/* Four tabs sharing the row, at the plate's own height. */}
      <div className="flex gap-px">
        {Array.from({ length: 4 }, (_, at) => (
          <div key={at} className="flex-1">
            <Skeleton width="100%" height="2.75rem" />
          </div>
        ))}
      </div>

      {/* One block, no taller than the shortest view's. */}
      <Skeleton width="100%" height="9rem" />
    </div>
  );
}
