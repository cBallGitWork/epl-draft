import PageHeader from "../../../components/shell/PageHeader";
import SkeletonRows from "../../../components/shell/SkeletonRows";
import Skeleton from "../../../components/shell/Skeleton";

// What a club screen looks like before FPL answers.
//
// **Its own, because `/prem/loading.tsx` draws a twenty-row LEAGUE TABLE.** Next
// applies a segment's loading file to everything beneath it, so until this
// existed every club page flashed the division's table on its way in — a
// skeleton that is a picture of a different screen is worse than none, because
// it promises the wrong thing.
//
// No plate and no club name: the colour and the name are both in the read that
// has not come back. `squad/[teamId]/loading.tsx` stands the same ground for the
// same reason.

export default function LoadingClub() {
  return (
    <div className="flex flex-col gap-2">
      <PageHeader title="Club" />
      <Skeleton width="100%" height="2.25rem" />
      <section className="cm-panel flex flex-col gap-2 p-2">
        <SkeletonRows count={20} height="var(--table-row)" />
      </section>
    </div>
  );
}
