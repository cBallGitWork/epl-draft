import Link from "next/link";
import type { ReactNode } from "react";
import Glyph from "./glyphs";
import { MORE, barSections, moreOwns, owns, type Section } from "./sections";

// The phone's navigation: CM's rail laid along the foot, a glyph over each word, and More opening a page.
// Fixed to the viewport, with the home indicator's inset inside its own ground; `--page-foot` keeps its room.

export default function ThumbRail({
  sections,
  pathname,
  live,
  mail,
}: {
  /** Already filtered for the round, so Live is absent between gameweeks. */
  sections: readonly Section[];
  pathname: string;
  /** Your live score, or the match clock, for the Live tab's glyph slot. */
  live: ReactNode;
  /** The unread badge, for the Mail tab's corner. */
  mail: ReactNode;
}) {
  return (
    <nav
      aria-label="Sections"
      className="cm-thumbrail fixed inset-x-0 bottom-0 z-50 grid auto-cols-fr grid-flow-col pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      {barSections(sections).map((section) => (
        <Tab
          key={section.href}
          href={section.href}
          label={section.label}
          here={owns(section.routes, pathname)}
          figure={section.onlyDuringGameweek ? live : section.glyph && <Glyph name={section.glyph} />}
          badge={section.glyph === "mail" ? mail : null}
          dot={section.onlyDuringGameweek}
        />
      ))}
      <Tab href={MORE} label="More" here={moreOwns(sections, pathname)} figure={<Glyph name="more" />} />
    </nav>
  );
}

/** One tab: a 24px figure over a 12px word, 56px tall, sharing the width evenly. */
function Tab({
  href,
  label,
  here,
  figure,
  badge = null,
  dot = false,
}: {
  href: string;
  label: string;
  here: boolean;
  figure: ReactNode;
  badge?: ReactNode;
  dot?: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={here ? "page" : undefined}
      className="relative grid min-h-14 min-w-0 grid-rows-[1.5rem_auto] content-center justify-items-center gap-y-1 px-0.5"
    >
      <span className="relative flex h-6 items-center">
        {figure}
        {badge}
      </span>
      <span className="flex max-w-full items-center truncate text-xs font-semibold leading-4">
        {dot ? <span aria-hidden className="mr-1 size-[7px] shrink-0 rounded-full bg-live" /> : null}
        {label}
      </span>
    </Link>
  );
}
