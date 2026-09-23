"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import ThumbRail from "./ThumbRail";
import { CREDITS, owns, sectionsFor } from "./sections";

// Championship Manager's rail: down the side of a desk, and laid along the foot of a phone (`ThumbRail`).
// It decides the section list once, from the round; client only because `usePathname` says where you are.

/** Championship Manager's back and forward arrows.
 *
 *  `docs/ui/reference/README.md` reads them off the rail: the date in yellow,
 *  **arrow steppers**, the manager's name in cyan, then the sections. They sit
 *  above the plates because that is where the game puts them (`cm9900/24.jpg`).
 *
 *  **Desk only** (Craig, 3 Sep 2026). Below `lg` the rail is 64px — already 16%
 *  of a 390 screen — and a phone has the browser's own back gesture plus a
 *  thumb that owns the bottom of the screen. Two more plates there would cost
 *  the sections the room they were measured into.
 *
 *  **Ink, not the accent.** CM draws them yellow, and our accent slot means
 *  "yours · selected · active" — an arrow is none of the three, and spending
 *  the accent on chrome is the slot violation DESIGN §5 is about.
 *
 *  **Forward is never greyed, and that is the honest answer rather than the
 *  faithful one.** CM greys Next when there is nowhere forward. Only the
 *  Navigation API can tell us that, `history` cannot, and it is absent in
 *  Safari — which is most of the phones this is hidden on anyway. A control
 *  greyed by a guess is worse than one that is simply live: pressing forward
 *  with nowhere to go does nothing, which is what it looks like it will do. */
function Steppers() {
  return (
    <div className="hidden border-b border-line lg:flex">
      <button
        type="button"
        onClick={() => history.back()}
        aria-label="Back"
        className="flex min-h-11 flex-1 items-center justify-center border-r border-chrome text-sm text-ink hover:bg-surface"
      >
        {/* A glyph rather than an icon set: there is none in this app, and
            introducing one for two arrows is a whole visual language for a pair
            of buttons (`Rail`'s own argument about the section labels). */}
        <span aria-hidden>←</span>
      </button>
      <button
        type="button"
        onClick={() => history.forward()}
        aria-label="Forward"
        className="flex min-h-11 flex-1 items-center justify-center text-sm text-ink hover:bg-surface"
      >
        <span aria-hidden>→</span>
      </button>
    </div>
  );
}

export default function Rail({
  matchday,
  live,
  mail,
}: {
  matchday: boolean;
  /** Your live score or the match clock, for the Live tab: a server node, since the number comes off Fantrax. */
  live: ReactNode;
  /** The unread badge for the Mail tab, likewise a server node. */
  mail: ReactNode;
}) {
  const pathname = usePathname();
  // **The paper wears the app's navigation too** (Craig, 16 Sep 2026: *"blue
  // bar on side, should show the regular menu options like the other pages,
  // dont have it on paper"*). It stood down here until then, and the paper
  // printed its own contents strip instead (`gazette/Index`, now deleted) —
  // which meant the one screen ten people open first was the one screen with no
  // way back to the app, in a register that had to re-draw the six section
  // names in newsprint to compensate.
  //
  // The recorded objection was that a rail would inset the broadsheet and shift
  // the `@container` threshold the two-column front page keys off. **Measured
  // before this line was deleted, and it does not**: `--page-frame` caps
  // `<main>` at 1152px and `globals.css` records that the rail is NOT inside
  // the frame, it is beside it. Probed at nine widths, the two-column grid
  // holds to 820px and the rail only exists from `lg` (1024) — so at the
  // tightest width where both objects are on screen there is ~200px of slack.

  const sections = sectionsFor(matchday);

  return (
    <>
      <ThumbRail sections={sections} pathname={pathname} live={live} mail={mail} />

      {/* **The rail, from `lg`.** Unchanged (Craig, 5 Sep: "Desktop unchanged").
          Its own ground rather than the body's, because it is opaque furniture:
          `PhotoGround` is `fixed … -z-10` and would otherwise run its faces up
          the side of the screen behind the labels. The rule down its right edge
          is what makes it a column rather than a margin — the plates run out
          partway and CM's rail keeps its boundary all the way to the foot. */}
      <nav
        aria-label="Sections"
        className="sticky top-0 z-50 hidden h-dvh w-[8.125rem] shrink-0 flex-col self-start overflow-y-auto border-r border-line bg-bg pl-[env(safe-area-inset-left)] lg:flex"
      >
        <Steppers />
        <ul className="flex flex-col">
          {sections.map((section) => {
            const here = owns(section.routes, pathname);
            return (
              <li key={section.href} className="contents">
                <Link
                  href={section.href}
                  aria-current={here ? "page" : undefined}
                  // No tracking. CM does not letterspace, and the rail is the
                  // one place the label has no room to spare for it.
                  className={`flex min-h-14 items-center justify-center border px-1 text-center font-chrome text-2xs font-bold uppercase hover:bg-surface ${
                    here ? "border-accent border-l-2 text-accent" : "border-chrome text-ink"
                  }`}
                >
                  {section.label}
                </Link>
              </li>
            );
          })}
        </ul>
        {/* The same link the phone's More page carries, and here for the same
            reason: a licence that requires attribution needs the page that gives
            it to be reachable. `mt-auto` puts it on the floor of the rail, below
            the sections and clear of them — it is not a seventh place to go. */}
        <Link
          href={CREDITS}
          className="mt-auto px-1 py-3 text-center font-chrome text-3xs uppercase text-faint hover:text-ink"
        >
          Credits
        </Link>
      </nav>
    </>
  );
}
