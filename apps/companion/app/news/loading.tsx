import PageHeader from "../components/shell/PageHeader";
import SkeletonRows from "../components/shell/SkeletonRows";

// The inbox, waiting on Fantrax.
//
// The LIST's height and not the page's: the item being read sits under it and
// arrives with it, and a skeleton for a body nobody has chosen yet would be a
// block of grey where the screen's whole point is a headline.

export default function Loading() {
  return (
    <div className="flex flex-col gap-2">
      <PageHeader title="News" />
      <div aria-busy>
        <SkeletonRows count={5} height="2.75rem" />
      </div>
    </div>
  );
}
