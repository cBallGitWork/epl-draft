"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import Modal from "./Modal";
import { SECTIONS, barSections, isPaperRoute, overflowSections, owns } from "./sections";

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
  // Whether the `More` sheet is open. The only state in this file, and it is
  // here rather than inside a `More` component because `Modal`'s own docblock
  // records the rule: every caller is rendered conditionally by a parent holding
  // the open state, so a Close button calls `onClose` and the panel goes away
  // because it is no longer rendered.
  const [more, setMore] = useState(false);
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
  const behind = overflowSections(sections);

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
        className="cm-foot fixed inset-x-0 bottom-0 z-50 flex pb-[env(safe-area-inset-bottom)] lg:hidden"
      >
        {barSections(sections).map((section) => (
          <Plate
            key={section.href}
            section={section}
            here={owns(section.routes, pathname)}
            score={section.onlyDuringGameweek ? live : null}
          />
        ))}
        {/* **The door, and it is a plate like any other.** It carries
            `aria-current` when you are standing in one of the sections behind
            it, because a bar that marks where you are must not go blank the
            moment you walk through it — that is the same rule every other plate
            keeps, and the reason `owns()` exists. `aria-expanded` says it opens
            something rather than going somewhere, which is the one thing a
            screen reader cannot see from the label. */}
        {behind.length > 0 ? (
          <button
            type="button"
            onClick={() => setMore(true)}
            aria-expanded={more}
            aria-current={behind.some((section) => owns(section.routes, pathname)) ? "page" : undefined}
            className="flex min-w-0 flex-1 flex-col items-center justify-center px-0.5 text-center text-xs font-medium leading-tight"
          >
            <span className="max-w-full truncate">More</span>
          </button>
        ) : null}
      </nav>

      {/* Full width and on the floor, because it is the foot row's own drawer:
          this only ever opens below `lg`, where 92vw is the whole screen anyway,
          and it should read as the bar unfolding rather than as a card that
          happened to appear. */}
      {more ? (
        <Modal onClose={() => setMore(false)} width="100vw" anchor="bottom">
          <ul className="flex flex-col">
            {behind.map((section) => {
              const here = owns(section.routes, pathname);
              return (
                <li key={section.href} className="contents">
                  <Link
                    href={section.href}
                    onClick={() => setMore(false)}
                    aria-current={here ? "page" : undefined}
                    // A row of a list under a thumb, so 44 and no `.cm-row`:
                    // this sheet only ever opens below `lg`, where that class
                    // says nothing anyway, and the desk's 28 would be a
                    // proportion for a surface the desk never sees.
                    //
                    // The accent is set here rather than by an `aria-[current]`
                    // variant: Tailwind v4 drops a class whose name is not
                    // literally in the scanned source, and a nav that silently
                    // stopped marking where you are is exactly the failure the
                    // `--color-fdr-` trap already cost this app once.
                    className={`flex min-h-11 items-center border-b border-line px-3 text-base font-bold last:border-b-0 hover:bg-raised ${
                      here ? "text-accent" : ""
                    }`}
                  >
                    {section.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </Modal>
      ) : null}

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
 *  The plate carries no class of its own: `.cm-foot` on the row owns the fill,
 *  the chrome face, the rule between plates and — through
 *  `.cm-foot > [aria-current]` — the yellow label that marks the one you are on.
 *  A plate owns its ink (DESIGN §2), so nothing here sets a colour; on blue,
 *  `--color-accent` is 5.32:1 and `--color-ink` 7.0.
 *
 *  **Mixed case at `text-xs`, which is what the game sets.** `cm9900/24.jpg`
 *  runs its foot row at around 13px mixed case regular; ours were 9px bold
 *  capitals, a size and a weight nothing in Championship Manager is set in, and
 *  the smallest type anywhere on the phone was on the object a thumb lands on
 *  most. 13px does not fit six plates at 320 and 12px does, so this is the
 *  largest size that clears `navfit`.
 *
 *  `flex-1` with `min-w-0`, so six plates share the width evenly and a long
 *  label truncates rather than pushing the bar off the screen — the failure
 *  `navfit.mjs` exists to catch. The label is its own `<span>` because the Live
 *  plate carries a second line under it, and `navfit` measures the label rather
 *  than everything the plate happens to say. */
function Plate({
  section,
  here,
  score,
}: {
  section: (typeof SECTIONS)[number];
  here: boolean;
  score: ReactNode;
}) {
  return (
    <Link
      href={section.href}
      aria-current={here ? "page" : undefined}
      className="flex min-w-0 flex-1 flex-col items-center justify-center px-0.5 text-center text-xs font-medium leading-tight"
    >
      <span className="max-w-full truncate">{section.label}</span>
      {score}
    </Link>
  );
}
