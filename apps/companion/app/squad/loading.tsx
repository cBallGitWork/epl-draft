import PageHeader from "../components/shell/PageHeader";
import SkeletonRows from "../components/shell/SkeletonRows";

// The squads waiting on Fantrax, headed "Squads": whose they are is not known yet.

export default function Loading() {
  return (
    <div aria-busy className="flex flex-col gap-3">
      <PageHeader title="Squads" />
      <SkeletonRows count={6} height="3.5rem" />
    </div>
  );
}
