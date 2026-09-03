"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SECTIONS, isPaperRoute, owns } from "./sections";

// Championship Manager's left rail: the app's sections stacked down the side of
// every desk screen, at every width.
//
// **It replaces the tab bar rather than joining it.** The bar was one component
// in two shapes — fixed to the foot of a phone, sticky across the top of a desk
// — and a rail would have been a third. It is one shape here because the labels
// are short enough to be one: at 9px bold uppercase the widest is "Gazetta" at
// 45px, so a 64px rail carries real words on a 390 phone. That is 16% of the
// screen against CM's own 11.25% (`docs/ui/reference/README.md`), and it buys no
// icon set — there is none, and inventing one to save 20px is a whole visual
// language for a rail that already fits.
//
// **Not `cm-tab`, and that was the mistake** (Craig, 31 Aug: "the side buttons
// still don't quite look like CM"). Championship Manager draws two different
// objects and this file had borrowed the wrong one. Its TAB STRIP — the row
// under a title bar — is a filled royal-blue plate with a bevel, and the current
// tab is pressed with yellow on it. Its RAIL is nothing like that: dark navy,
// the page's own ground, with each entry in a thin outlined box and its label in
// white. Compare `cm9900/12.jpg` and `19.jpg` — the strip and the rail are in
// the same screenshot and they do not match.
//
// So the rail is outlined here and filled nowhere. What it costs is the pressed
// bevel that used to mark the current section, which the accent and an edge do
// instead — the same pair `league/TableRow` marks "yours" with, so the mark for
// "the one you are on" is one object in two places rather than two.
//
// **The items sit at the FOOT of the rail below `lg`.** CM's own rail is
// top-aligned, and on a 844px phone that puts the first section 800px from the
// thumb. PRODUCT.md's reference viewing condition is a phone held one-handed and
// it outranks the look (DESIGN.md's own preamble says so), so the plates stay in
// the thumb's arc on a phone and stand where the game put them on a desk.
//
// Client only because the current section has to be known, and `usePathname` is
// the only way to know it. Nothing else here is interactive.

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

export default function Rail({ matchday }: { matchday: boolean }) {
  const pathname = usePathname();
  // The paper is the other register and prints its own index (`gazette/Index`).
  // A rail beside it would inset a broadsheet by 64px of navy — and shift the
  // `@container` threshold the front page's two-column layout keys off, so the
  // paper would go narrow for a reason that has nothing to do with the paper.
  // `sections.ts` says which routes are the paper, so an inside page added
  // there stands the rail down without this file hearing about it.
  if (isPaperRoute(pathname)) return null;

  const sections = SECTIONS.filter(
    (section) => matchday || !section.onlyDuringGameweek,
  );

  return (
    <nav
      aria-label="Sections"
      // Its own ground rather than the body's, because it is opaque furniture:
      // `PhotoGround` is `fixed … -z-10` and would otherwise run its faces up
      // the side of the screen behind the labels. The rule down its right edge
      // is what makes it a column rather than a margin — the plates run out
      // partway and CM's rail keeps its boundary all the way to the foot of the
      // screen. Its own safe-area insets for the same reason the fixed bar had
      // them: a sticky full-height element is positioned against the viewport,
      // so the home indicator and a landscape notch both land on it.
      className="sticky top-0 z-50 flex h-dvh w-16 shrink-0 flex-col justify-end self-start overflow-y-auto border-r border-line bg-bg pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] lg:w-[8.125rem] lg:justify-start"
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
                // No tracking. CM does not letterspace, and the rail is the one
                // place the label has no room to spare for it.
                className={`flex min-h-11 items-center justify-center border px-1 text-center font-chrome text-3xs font-bold uppercase hover:bg-surface lg:min-h-14 lg:text-2xs ${
                  here
                    ? "border-accent border-l-2 text-accent"
                    : "border-chrome text-ink"
                }`}
              >
                {section.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
