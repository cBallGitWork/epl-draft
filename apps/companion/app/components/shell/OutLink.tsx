import type { ReactNode } from "react";
import { BUTTON } from "./ButtonLink";

// A link that leaves the app.
//
// **Five sites, counted 7 Sep 2026** — the lineup planner's way to Fantrax, the
// FPL tab's way to FPL, the pool's Claim, the player's Transfer tab, and the
// comparison's two. Well past §1's third occurrence, and they had already
// drifted in the two ways that matter.
//
// **The arrow is HERE, and that is the whole reason this exists.** Every call
// site typed `&nearr;` after its own label, and React serves that entity as
// `&amp;nearr;` — so three shipped screens printed the literal text "Open on FPL
// &nearr;" to readers. One arrow copied five times is five chances to get it
// wrong and one place to fix it; the label a caller passes is now words only.
//
// **`rel` is not the caller's business either.** Four sites said
// `noopener noreferrer` and the planner said `noreferrer` alone — not a
// deliberate difference, just the one that was copied from somewhere else.
//
// Not `ButtonLink`, which is a `next/link` router link: a route this app does
// not own is a plain anchor, and `LineupPlanner` already carried that note.

export default function OutLink({
  href,
  className = BUTTON,
  children,
}: {
  href: string;
  /** The plate. Defaults to the one four of the five wear; the FPL tab's way out
   *  is set in small capitals and passes its own. A second consumer rather than
   *  a parameter added for later (§1). */
  className?: string;
  /** The label, in words. The arrow is not yours to add. */
  children: ReactNode;
}) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {children} ↗
    </a>
  );
}
