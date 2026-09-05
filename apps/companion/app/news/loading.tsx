import { LEAGUE_NAME } from "@epl/core";
import Caption from "../components/shell/Caption";
import PageHeader from "../components/shell/PageHeader";
import SkeletonRows from "../components/shell/SkeletonRows";
import { NEWS } from "../titles";

// The inbox, waiting on Fantrax.
//
// The LIST's height and not the page's: the item being read sits under it and
// arrives with it, and a skeleton for a body nobody has chosen yet would be a
// block of grey where the screen's whole point is a headline.
//
// The bar and the caption are the real ones, not skeletons — they are known
// before anything is fetched, and a page whose title arrives late renames itself
// in front of the reader.

export default function Loading() {
  return (
    <div className="flex flex-col gap-2">
      <PageHeader title={LEAGUE_NAME} competition />
      <Caption>{NEWS}</Caption>
      <div aria-busy>
        <SkeletonRows count={5} height="2.75rem" />
      </div>
    </div>
  );
}
