import PageHeader from "../../components/shell/PageHeader";
import Skeleton from "../../components/shell/Skeleton";

// One squad waiting on the roster and the round's points, headed with the section's word: whose it is is not known yet.

export default function Loading() {
  return (
    <div aria-busy className="flex flex-col gap-3">
      <PageHeader title="Squad" sub={<Skeleton width="12rem" height="0.75rem" />} />

      {/* The pitch/list toggle and the player count keep their row, so the
          arrangement below does not push them down when it lands. */}
      <div className="flex items-center justify-between gap-3">
        <Skeleton width="6rem" height="1.5rem" />
        <Skeleton width="4.5rem" height="1.5rem" />
      </div>

      <div className="bleed">
        <Skeleton width="100%" height="22rem" />
      </div>
    </div>
  );
}
