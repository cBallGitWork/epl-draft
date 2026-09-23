import Link from "next/link";
import { TAB } from "@/app/desk";

// Championship Manager's blue tab strip: the row of plates under a title bar
// where you pick one of a set.
//
// Extracted at the third copy (CODE_RULES §1). `league/SectionNav` and
// `squad/[teamId]/TeamTabs` had written the identical `nav`/`Link` mechanics
// out separately, and `prem/PremNav` was about to be the third — which is the
// point the rule says the abstraction has been earned rather than guessed at.
// `shell/Caption` and `shell/PageHeader` record the same decision taken for the
// two boxes above this one.
//
// **What is shared is the STRIP, not the entries.** Each caller keeps its own
// list, its own keys and its own docblock, because those record decisions —
// which five tabs, and why Matchups is not one of them. What moves here is the
// mechanics every CM strip shares whatever it is listing: the row that fills its
// width, the plate, the current mark, and the greying of an entry with nothing
// behind it.
//
// **`components/league/GroupNav` deliberately stays where it is.** It looks like
// this and is not: it wraps rather than filling one row, it is drawn shorter
// (`min-h-11 lg:min-h-9` against the plate's own 2.75/3.5rem), and it is a row of
// STAT GROUPS read off core's `GROUPS` rather than a row of routes. Folding it in
// costs two props for a second shape, which is the generic mechanism §1 forbids.

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
  /** Which tab you are on, and `null` is a real answer rather than a missing
   *  one: `SectionNav`'s Matchups is a section a route can BE on without being
   *  in the strip, so no plate is current there. Player Stats used to be the
   *  other such case and no longer is — it wears the shell and takes its own
   *  plate (5 Sep 2026). */
  current: K | null;
  /** Tabs with nothing behind them for this subject — a side that has made no
   *  transactions, a period with no pairing.
   *
   *  **Greyed and still a link, never hidden.** `cm0102/07.jpg` draws an
   *  unavailable `Training` greyed and leaves it in place: a strip that loses a
   *  plate has moved every plate after it, and a reader who tapped Transfers
   *  yesterday would find Fixtures where it was. */
  dim?: readonly K[];
  /** How much room the labels need.
   *
   *  `phrase` is the section strip's 11px with room round it, for entries like
   *  "Player Stats". `word` is the team strip's 9px, chosen when every entry is
   *  one word so the plates all sit on one line.
   *
   *  **Measured at 390 on 3 Sep 2026, and neither is drift.** This used to say
   *  one of them probably was, and asked for the measurement; here it is.
   *
   *  A `word` strip is four or five plates sharing the width, so each is about
   *  76px with 8px of padding a side — 56px of room for a label. Every label in
   *  every strip is one word and fits at 11px except one: `PremNav`'s "Team
   *  Stats" needs 70px unwrapped at `2xs` and 58px at `3xs`, so at 11px it wraps
   *  to two lines inside a 44px plate. Dropping the padding to `px-1` buys 8px
   *  and still leaves it 2px short.
   *
   *  So the 9px is load-bearing, and it is bought by ONE label. DESIGN §6's
   *  density table says a tab is set at `2xs`, which makes `word` the table's
   *  documented exception rather than a second opinion — and the cheapest way to
   *  delete it is to shorten that label, which is Craig's call and not a
   *  refactor's. `phrase` keeps 11px because a section strip's entries are
   *  phrases and it has fewer of them. */
  labels?: "phrase" | "word";
  /** 36px under a thumb rather than 44 — a view switch on the match screens, under PRODUCT's
   *  recorded 36px exception (Craig, 23 Sep 2026). */
  compact?: boolean;
}) {
  // The strip fills the row. CM's tabs run edge to edge across the whole content
  // width (`cm9900/24.jpg`, `25.jpg`) — a tab strip is a bar, and plates hugging
  // the left are buttons.
  return (
    <nav aria-label={label} className="flex">
      {tabs.map((tab) => {
        const here = tab.key === current;
        return (
          <Link
            key={tab.key}
            href={tab.href}
            aria-current={here ? "page" : undefined}
            // The accent carries "the one you are on", from `desk.css` rather
            // than from here: red is the brand and the live signal and never a
            // statement about where you are.
            className={`${TAB} ${LABELS[labels]} ${compact ? "cm-tab-compact" : ""} ${
              // Never on the tab you are on: the accent already says "selected",
              // and greying the current plate would have the strip make two
              // claims about one object.
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
  word: "px-2 text-3xs",
} as const;
