import PageHeader from "../../../components/shell/PageHeader";
import SkeletonRows from "../../../components/shell/SkeletonRows";
import Skeleton from "../../../components/shell/Skeleton";

// What a club screen looks like before FPL answers.
//
// **The only boundary a club route has, and that took two goes.** Next applies a
// segment's loading file to everything beneath it, so `prem/loading.tsx` — a
// twenty-row LEAGUE TABLE — covered every club page, and a club page cold-loaded
// streamed the division's table before its own skeleton: a picture of a
// different screen, which is worse than none because it promises the wrong
// thing. Adding this file made it two skeletons rather than one, not none. The
// fix was moving the four competition routes into `prem/(competition)/` so their
// boundary stops where their subtree does; this is now the only fallback under
// `/prem/club`.
//
// No plate and no club name: the colour and the name are both in the read that
// has not come back. `squad/[teamId]/loading.tsx` stands the same ground for the
// same reason.

/** How many rows to hold the frame open with.
 *
 *  **A frame hint and never a fact**, which is the rule `SkeletonRows` states
 *  about its own `count`: a squad is about thirty men and a fixture run is
 *  thirty-eight, so this is neither of them — it is enough rows that the real
 *  ones land inside the boxes rather than pushing them down the screen.
 *  Deliberately not `prem/Shell`'s `PANEL_ROWS`, which means "the Premier League
 *  is twenty clubs" and is a claim about the division, not about this list. */
const SKELETON_ROWS = 20;

export default function LoadingClub() {
  return (
    <div className="flex flex-col gap-2">
      <PageHeader title="Club" />
      <Skeleton width="100%" height="2.25rem" />
      <section className="cm-panel flex flex-col gap-2 p-2">
        <SkeletonRows count={SKELETON_ROWS} height="var(--table-row)" />
      </section>
    </div>
  );
}
