"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import Modal from "./Modal";
import { barSections, overflowSections, owns, type Section } from "./sections";

// The blue strip across the foot of a phone, and the drawer behind its last
// plate.
//
// **Its own file because it is its own OBJECT.** DESIGN §2 names three — a tab
// strip, a rail and a foot row — and says the paragraph describing them "has now
// been wrong twice in the same way", both times because two of them were blue.
// The rail and this were in one file until the drawer landed and took it past
// §4's soft ceiling; they share a section table and nothing else. The rail is
// outlined navy down the side of a desk and runs out of HEIGHT; this is a filled
// strip across the bottom of a phone and runs out of WIDTH per plate.
//
// Fixed rather than sticky: it is across the bottom of the VIEWPORT, which is
// what a thumb reaches, and a sticky element in the body's flex row would still
// take a column's width from the page. `--page-foot` holds the space for it and
// grows below `lg` in `globals.css` for exactly this. Its own bottom inset,
// because a fixed element is positioned against the viewport and the home
// indicator lands on it. The plates butt with no gap, which is how CM draws a
// strip.

export default function FootRow({
  sections,
  pathname,
  live,
}: {
  /** Already filtered for the round: the Live section is absent between
   *  gameweeks, so this is five plates midweek and six on a Saturday. */
  sections: readonly Section[];
  pathname: string;
  /** Your live score, for the Live plate to carry under its label. */
  live: ReactNode;
}) {
  // The only state in either nav file, and it is here rather than inside a
  // `More` component because `Modal`'s own docblock records the rule: every
  // caller is rendered conditionally by a parent holding the open state, so a
  // Close button calls `onClose` and the panel goes away because it is no longer
  // rendered.
  const [more, setMore] = useState(false);
  const behind = overflowSections(sections);

  return (
    <>
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
            screen reader cannot see from the label.

            Absent when nothing is behind it: a `More` that opens onto an empty
            sheet is a control that does nothing. */}
        {behind.length > 0 ? (
          <button
            type="button"
            onClick={() => setMore(true)}
            aria-expanded={more}
            aria-current={
              behind.some((section) => owns(section.routes, pathname)) ? "page" : undefined
            }
            className="flex min-w-0 flex-1 flex-col items-center justify-center px-0.5 text-center text-xs font-medium leading-tight"
          >
            <span className="max-w-full truncate">More</span>
          </button>
        ) : null}
      </nav>

      {/* Full width and on the floor, because it is the foot row's own drawer:
          this only ever opens below `lg`, and it should read as the bar
          unfolding rather than as a card that happened to appear. */}
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
  section: Section;
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
