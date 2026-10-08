"use client";

import Link from "@/app/components/shell/Link";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import Pending from "./Pending";
import ThumbRail from "./ThumbRail";
import { CREDITS, owns, sectionsFor } from "./sections";
import { SMALL_CAPS } from "@/app/desk";

// Championship Manager's rail: down the side of a desk, and laid along the foot of a phone (`ThumbRail`).
// It decides the section list once, from the round; client only because `usePathname` says where you are.

/** CM's back and forward arrows, desk only, in ink: the accent means yours or selected, and an arrow is neither.
 *  Forward is never greyed, because `history` cannot say whether there is anywhere forward. */
function Steppers() {
  return (
    <div className="hidden border-b border-line lg:flex">
      <button
        type="button"
        onClick={() => history.back()}
        aria-label="Back"
        className="flex min-h-11 flex-1 items-center justify-center border-r border-chrome text-sm text-ink hover:bg-surface"
      >
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
  /** The unread badge for the Mail tab, which the layout hands its inbox read. */
  mail: ReactNode;
}) {
  const pathname = usePathname();
  // The paper wears the rail too; it sits beside `--page-frame`, not inside it, so the front page's `@container` holds.

  const sections = sectionsFor(matchday);

  return (
    <>
      <ThumbRail sections={sections} pathname={pathname} live={live} mail={mail} />

      {/* The rail, from `lg`, on its own opaque ground: the fixed `PhotoGround` would run up behind the labels. */}
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
                  // No letterspacing: the rail's labels have no room to spare.
                  // A tapped section is marked as the one you are on while its page is on the way (`Pending`).
                  className={`flex min-h-14 items-center justify-center border px-1 text-center font-chrome ${SMALL_CAPS} hover:bg-surface ${
                    here
                      ? "border-accent border-l-2 text-accent"
                      : "border-chrome text-ink has-[>[data-pending]]:border-l-2 has-[>[data-pending]]:border-accent has-[>[data-pending]]:text-accent"
                  }`}
                >
                  {section.label}
                  <Pending />
                </Link>
              </li>
            );
          })}
        </ul>
        {/* An attribution licence needs the credits page reachable; `mt-auto` floors it below the sections. */}
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
