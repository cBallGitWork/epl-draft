import BackPlate from "../../../components/shell/BackPlate";
import PageHeader from "../../../components/shell/PageHeader";
import SkeletonRows from "../../../components/shell/SkeletonRows";
import Skeleton from "../../../components/shell/Skeleton";
import { PANEL } from "@/app/desk";
import { PREM } from "../../routes";

// What a club screen looks like before FPL answers; the only loading boundary under `/prem/club`.
// The competition routes sit in `prem/(competition)/` so their table skeleton never covers a club page.
// No plate and no club name: both are in the read that has not come back.

/** A frame hint, not a fact: enough rows for the real ones to land in, unrelated to `PANEL_ROWS`. */
const SKELETON_ROWS = 20;

export default function LoadingClub() {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-stretch">
        <BackPlate fallback={PREM} />
        <div className="min-w-0 flex-1">
          <PageHeader title="Club" />
        </div>
      </div>
      <Skeleton width="100%" height="2.25rem" />
      <section className={PANEL}>
        <SkeletonRows count={SKELETON_ROWS} height="var(--table-row)" />
      </section>
    </div>
  );
}
