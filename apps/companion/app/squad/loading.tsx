import PageHeader from "../components/shell/PageHeader";
import SkeletonRows from "../components/shell/SkeletonRows";

// The squads, waiting on Fantrax.
//
// Headed "Squads" rather than "Your squad": which of the two it is depends on
// whether the cookie names a team in this league, and a heading that guessed
// would be a claim about the reader made before anything was read.

export default function Loading() {
  return (
    <div aria-busy className="flex flex-col gap-3">
      <PageHeader title="Squads" />
      <SkeletonRows count={6} height="3.5rem" />
    </div>
  );
}
