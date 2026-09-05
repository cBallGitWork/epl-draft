"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SECTIONS, isPaperRoute, owns } from "./sections";

// Championship Manager's navigation, in the two shapes the game itself has: a
// rail down the side of a desk screen, and a blue plate row across the foot.
//
// **The phone gets the FOOT ROW** (Craig, 5 Sep 2026, with `cm0102/02.jpg` and
// the news shot: "mobile view needs the blue nav bar at the bottom… Desktop
// unchanged"). Both objects are in the reference and they are not the same
// thing: `cm9900/24.jpg` runs `Team Stats · Player Stats · Referee Stats ·
// Awards · History` in blue across the bottom of the League Table, and the news
// screen runs `Contracts and Media · Transfers · Jobs · Records`. The rail is
// dark navy with outlined plates; the foot row is filled royal blue. So this
// file draws the rail above `lg` and the foot row below it, and neither is a
// squeezed version of the other.
//
// **It cost the phone nothing and gave it 64px.** The rail was 16% of a 390
// screen against CM's own 11.25%, and it was the width every scoreline row on
// the app has been fighting for — measured the same day, a name column on the
// Live tab went from 58px to 74 the moment the rail came off the side. A foot
// row costs 44px of HEIGHT instead, which is the axis a phone has to spare.
//
// **Not `cm-tab`, and that was the mistake** (Craig, 31 Aug: "the side buttons
// still don't quite look like CM") — which is true of the RAIL and was never
// true of the foot row. Championship Manager draws two different objects and
// this file had borrowed the wrong one for the side. Its TAB STRIP and its FOOT
// ROW are filled royal-blue plates with a bevel and the current one marked in
// yellow; its RAIL is dark navy, the page's own ground, with each entry in a
// thin outlined box and its label in white. Compare `cm9900/12.jpg` and
// `19.jpg` — the strip and the rail are in the same screenshot and they do not
// match. Both spellings are now drawn, each where the game draws it.
//
// **Six plates, and the grouping question was answered by measuring.** Craig
// asked to "group options where appropriate", and the honest answer is that
// nothing needed grouping away: at 390 six plates are 65px each and the widest
// label is "GAZETTA" at 38px in 9px bold uppercase; at 320 they are 53px, which
// still clears it. `navfit.mjs` holds that line. The grouping that WAS
// appropriate went inside a section instead — see `sections.ts` on where the
// news inbox lives.
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
    <>
      {/* **The foot row, below `lg`.** Fixed rather than sticky: it is across
          the bottom of the VIEWPORT, which is what a thumb reaches, and a
          sticky element in the body's flex row would still take a column's
          width from the page. `--page-foot` is what holds the space for it, and
          it grows below `lg` in `globals.css` for exactly this.

          Its own bottom inset, because a fixed element is positioned against
          the viewport and the home indicator lands on it. The plates butt with
          no gap, which is how CM draws a strip. */}
      <nav
        aria-label="Sections"
        className="fixed inset-x-0 bottom-0 z-50 flex pb-[env(safe-area-inset-bottom)] lg:hidden"
      >
        {sections.map((section) => (
          <Plate key={section.href} section={section} here={owns(section.routes, pathname)} />
        ))}
      </nav>

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
      </nav>
    </>
  );
}

/** One plate of the foot row.
 *
 *  `.cm-tab` and nothing else: the plate carries the royal blue, the bevel, the
 *  chrome face and — through `.cm-tab[aria-current="page"]` — the yellow label
 *  and yellow border that mark the one you are on. A plate owns its ink
 *  (DESIGN §2), so nothing here sets a colour, which is also why the current
 *  mark could not be hand-rolled the way the rail's is: on blue,
 *  `--color-accent` is 5.32:1 and the rail's own `text-ink` would be 7.0.
 *
 *  `flex-1` with `min-w-0`, so six plates share the width evenly and a long
 *  label truncates rather than pushing the bar off the screen — the failure
 *  `navfit.mjs` exists to catch. */
function Plate({
  section,
  here,
}: {
  section: (typeof SECTIONS)[number];
  here: boolean;
}) {
  return (
    <Link
      href={section.href}
      aria-current={here ? "page" : undefined}
      className="cm-tab flex min-w-0 flex-1 items-center justify-center truncate px-1 text-center text-3xs font-bold uppercase"
    >
      {section.label}
    </Link>
  );
}
