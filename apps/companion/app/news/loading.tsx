import PageHeader from "../components/shell/PageHeader";
import SkeletonRows from "../components/shell/SkeletonRows";
import { NEWS } from "../titles";

// The inbox, waiting on Fantrax.
//
// The LIST's height and not the page's: the item being read sits under it and
// arrives with it, and a skeleton for a body nobody has chosen yet would be a
// block of grey where the screen's whole point is a headline.
//
// **The bar says the plain word, and it is the one place a title is allowed to
// grow.** This file's rule was that the bar is never a skeleton, "because a page
// whose title arrives late renames itself in front of the reader" — and it held
// while the title was the league's, which is a constant. It is the MANAGER's now
// (5 Sep 2026), and a per-reader title cannot be known before the cookie is read
// and the league is fetched. So the frame draws what a signed-out reader also
// gets, and a signed-in one sees it grow a name rather than change one.

export default function Loading() {
  return (
    <div className="flex flex-col gap-2">
      <PageHeader title={NEWS} />
      <SkeletonRows count={5} height="2.75rem" />
    </div>
  );
}
