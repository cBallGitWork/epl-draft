import Link from "next/link";
import { TAB } from "@/app/desk";

// Championship Manager's blue tab strip: one row of plates, edge to edge under a title bar, picking one of a set.
// Callers keep their own tab lists; `components/league/GroupNav` wraps and is shorter, so it is not one of these.

export interface Tab {
  href: string;
  label: string;
  key: string;
}

export default function TabStrip<K extends string>({
  label,
  tabs,
  current,
  dim = [],
  labels = "phrase",
  compact = false,
}: {
  /** What the strip is a strip OF — "League views", "Team views". */
  label: string;
  tabs: readonly (Tab & { key: K })[];
  /** Which tab you are on; `null` is a real answer, for a route in the section that no plate names (Matchups). */
  current: K | null;
  /** Tabs with nothing behind them: greyed and still a link, never hidden, so no plate moves. */
  dim?: readonly K[];
  /** `phrase` pads multi-word entries; `word` sizes each plate to its one word under a thumb. */
  labels?: "phrase" | "word";
  /** 36px under a thumb rather than 44, under PRODUCT's recorded 36px exception. */
  compact?: boolean;
}) {
  return (
    <nav aria-label={label} className="flex">
      {tabs.map((tab) => {
        const here = tab.key === current;
        return (
          <Link
            key={tab.key}
            href={tab.href}
            aria-current={here ? "page" : undefined}
            // `desk.css` marks the current tab in the accent, never in red.
            className={`${TAB} ${LABELS[labels]} ${compact ? "cm-tab-compact" : ""} ${
              // Never greys the current tab, which the accent already marks.
              !here && dim.includes(tab.key) ? "cm-out" : ""
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}

const LABELS = {
  phrase: "px-3 text-2xs",
  word: "whitespace-nowrap px-1.5 text-2xs max-lg:flex-auto max-[374px]:px-1 max-[374px]:text-3xs lg:px-2",
} as const;
