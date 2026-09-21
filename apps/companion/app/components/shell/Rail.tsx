"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import FootRow from "./FootRow";
import { owns, sectionsFor } from "./sections";

// Championship Manager's navigation, in the two shapes the game itself has: a
// rail down the side of a desk screen, and a blue plate row across the foot.
//
// **The phone gets the FOOT ROW** (Craig, 5 Sep 2026, with `cm0102/02.jpg` and
// the news shot: "mobile view needs the blue nav bar at the bottom… Desktop
// unchanged"). Both objects are in the reference and they are not the same
// thing: `cm9900/24.jpg` runs `Team Stats · Player Stats · Referee Stats ·
// Awards · History` in blue across the bottom of the League Table, and the news
// screen runs `Contracts and Media · Transfers · Jobs · Records`. The rail is
// dark navy with outlined plates; the foot row is filled royal blue. Neither is
// a squeezed version of the other, so **the foot row is `FootRow.tsx` and this
// file is the rail** — they were one file until the overflow drawer landed and
// took it past §4's soft ceiling, which was the point at which "two objects, one
// file" stopped being a convenience and started being the thing DESIGN §2 warns
// about. What is left here is the rail, and the choice of which shape a width
// gets: this decides the section list once, from the round, and hands it down.
//
// **It cost the phone nothing and gave it 64px.** The rail was 16% of a 390
// screen against CM's own 11.25%, and it was the width every scoreline row on
// the app has been fighting for — measured the same day, a name column on the
// Live tab went from 58px to 74 the moment the rail came off the side. A foot
// row costs 44px of HEIGHT instead, which is the axis a phone has to spare.
//
// **Three objects, not two** (5 Sep 2026, the second correction to this note).
// The first said the rail was not a `cm-tab` and was right; it then put the FOOT
// ROW in one, on the strength of both being blue. They are not the same object
// either. Championship Manager bevels the tab strip under a title bar — a set of
// a subject's views, one of them pressed — and draws the foot row as a single
// filled strip divided by rules, with the current entry marked on its label
// alone. Wearing `cm-tab` for both meant two identical bevelled strips
// bracketing every phone screen, twelve bevel edges across 390px, and nothing
// saying which was the section and which was the view. `.cm-foot` in `desk.css`
// is the third object; the rail is outlined navy, and all three are drawn where
// the game draws them.
//
// **Six plates, and the grouping question was answered by measuring.** Craig
// asked to "group options where appropriate", and the honest answer is that
// nothing needed grouping away: at 390 six plates are 65px each and at 320 they
// are 53px. The labels are mixed case at `text-xs` now rather than 9px bold
// capitals — CM sets its own foot row at around 13px mixed case, and 9px bold
// caps is a size nothing in the game is set in — so the measurement was taken
// again: 12px medium "Gazetta" needs 44px against 49px of room at 320.
// `navfit.mjs` holds that line. The grouping that WAS appropriate went inside a
// section instead — see `sections.ts` on where the news inbox lives.
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

export default function Rail({
  matchday,
  live,
}: {
  matchday: boolean;
  /** Your live score, for the Live plate to carry under its label. A server
   *  component handed down as a node, because this file is a client one and the
   *  number comes off Fantrax — the layout renders it and the rail places it.
   *
   *  Rendered on the section marked `onlyDuringGameweek`, which is the Live one.
   *  Not matched on its href: `sections.ts` is where the app's divisions are
   *  written down, and a component that reaches past it for a literal route is
   *  the drift that table exists to prevent. The flag is also the honest key —
   *  it marks the section that exists only while a round is on, and a score is
   *  exactly the fact that exists only then. */
  live: ReactNode;
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
      <FootRow sections={sections} pathname={pathname} live={live} />

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
        {/* The same link the phone's drawer carries, and here for the same
            reason: a licence that requires attribution needs the page that gives
            it to be reachable. `mt-auto` puts it on the floor of the rail, below
            the sections and clear of them — it is not a seventh place to go. */}
        <Link
          href="/credits"
          className="mt-auto px-1 py-3 text-center font-chrome text-3xs uppercase text-faint hover:text-ink"
        >
          Credits
        </Link>
      </nav>
    </>
  );
}
