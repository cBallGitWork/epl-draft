import Link from "next/link";
import { GROUPS, type GroupKey } from "@epl/core";
import { TAB } from "@/app/desk";

// CM's second foot row: the stat groups, as a row of blue plates under a board.
//
// Two boards print it — Team Stats and Player Stats — with the same class string
// character for character and only the route and the entry list differing. That
// is the shape `TableHeads` was extracted on, and the same bug waiting: the two
// were written a day apart, and the second already had to be told twice that the
// row is blue rather than grey.
//
// **Blue, not grey** (Craig, 1 Sep 2026: "remember the bottom row is blue"). The
// reference settles it — CM's foot row is the same royal blue as its tab strip
// with white labels, and the current one carries a yellow border and yellow
// text. Grey is the BUTTON plate in this vocabulary: a dropdown, a column head.
// This row is navigation and takes the navigation colour, which is why it wears
// `cm-tab` and not `cm-bevel` — the mark for "the one you are on" then comes
// free from `desk.css` and cannot drift from the strip six inches above it.
//
// **It wraps rather than overflowing.** Four plates do not fit a 390 phone —
// "Discipline" ran off the right edge — and a nav you cannot see the end of is a
// nav with entries nobody finds.

export default function GroupNav({
  group,
  href,
  omit = [],
}: {
  group: GroupKey;
  /** Where a group leads. The two boards live on different routes and each
   *  keeps its own, rather than this file learning about either. */
  href: (group: GroupKey) => string;
  /** Groups this board has nothing for. The player board omits `appearances`,
   *  whose only category is minutes and which Craig asked to drop from it —
   *  a group with no categories behind it is a button that leads nowhere. */
  omit?: readonly GroupKey[];
}) {
  return (
    <nav aria-label="Stat groups" className="flex flex-wrap">
      {GROUPS.filter((entry) => !omit.includes(entry.key)).map((entry) => (
        <Link
          key={entry.key}
          href={href(entry.key)}
          aria-current={entry.key === group ? "page" : undefined}
          className={`${TAB} min-h-11 px-2 text-2xs lg:min-h-9`}
        >
          {/* The short words keep five plates on one row at 390. */}
          <span className="lg:hidden">{entry.short}</span>
          <span className="max-lg:hidden">{entry.label}</span>
        </Link>
      ))}
    </nav>
  );
}
