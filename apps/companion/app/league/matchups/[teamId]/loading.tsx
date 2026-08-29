import LeagueShell from "../../Shell";
import Skeleton from "../../../components/shell/Skeleton";

// One head-to-head, waiting on both elevens.
//
// The board is a scoreline with the two sides in it and a pitch under it, and
// the pitch is the tall thing — it is drawn at roughly the height fifteen cards
// take on a phone so the toggle above it does not travel when they arrive.

export default function Loading() {
  return (
    <LeagueShell title="Head-to-head" current="matchups">
      <div aria-busy className="flex flex-col gap-2">
        <div className="elev flex items-center gap-3 rounded-xl border border-line bg-surface px-3">
          <Skeleton width="45%" height="3.5rem" />
          <Skeleton width="45%" height="3.5rem" />
        </div>

        {/* The view toggle's own row, which the board keeps whichever side is
            open. */}
        <div className="flex items-center justify-between gap-3 px-0.5">
          <Skeleton width="5rem" height="1.5rem" />
          <Skeleton width="6rem" height="1.5rem" />
        </div>

        <div className="bleed">
          <Skeleton width="100%" height="22rem" />
        </div>
      </div>
    </LeagueShell>
  );
}
