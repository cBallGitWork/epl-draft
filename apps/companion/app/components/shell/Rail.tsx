"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SECTIONS, owns } from "./sections";

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
// `cm-tab`, which `league/SectionNav.tsx` already wears: the plate is bevelled
// and the current one is drawn PRESSED with the accent on its label. The bar
// marked its tab with a border edge that flipped sides between the two shapes,
// and a rail would have needed a third case; a pressed bevel needs none.
//
// **The items sit at the FOOT of the rail below `lg`.** CM's own rail is
// top-aligned, and on a 844px phone that puts the first section 800px from the
// thumb. PRODUCT.md's reference viewing condition is a phone held one-handed and
// it outranks the look (DESIGN.md's own preamble says so), so the plates stay in
// the thumb's arc on a phone and stand where the game put them on a desk.
//
// Client only because the current section has to be known, and `usePathname` is
// the only way to know it. Nothing else here is interactive.

/** The paper is the other register and prints its own index (`gazette/Index`).
 *  A rail beside it would inset a broadsheet by 64px of navy — and shift the
 *  `@container` threshold the front page's two-column layout keys off, so the
 *  paper would go narrow for a reason that has nothing to do with the paper. */
const PAPER = "/";

export default function Rail({ matchday }: { matchday: boolean }) {
  const pathname = usePathname();
  if (pathname === PAPER) return null;

  const sections = SECTIONS.filter((section) => matchday || !section.onlyDuringGameweek);

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
                className="cm-tab flex min-h-11 items-center justify-center px-1 text-center text-3xs font-bold uppercase lg:min-h-9 lg:text-2xs"
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
