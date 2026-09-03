import type { ReactNode } from "react";

// The two cells a CM board's rows are built from, opposite `TableHeads`.
//
// Both arrived at three occurrences and not before. The index block was written
// out verbatim in `league/team-stats`, `prem/team-stats` and `players/Board`;
// the linked name row in the two boards and `prem/ClubRow`. `results/Result`
// carries a fourth spelling of the link — `px-2 hover:bg-raised`, on a flex row
// rather than a table — and its own docblock records that as the THIRD time the
// rule was rediscovered rather than read. It is a genuine variant and stays put.
//
// What is NOT here: the crest-and-name cell. It looks like five occurrences and
// is two — `prem/ClubRow` and `prem/team-stats` draw the same 26px badge, while
// `Match` draws 22 with a spacer for a club the snapshot lacks, the club page
// draws 56 in a heading, `players/[fantraxId]` puts one on the portrait, and
// `MatchList` draws 24 with a round grey fallback. A component spanning those
// takes a size, a fallback and an alignment, which is CODE_RULES §1's "never
// build a generic mechanism" wearing a badge. Two is a coincidence; copy it.

/** The ordinal in Championship Manager's own index block.
 *
 *  `cm9900/24.jpg` runs `1st 2nd 3rd` down the left of every table it draws,
 *  and a column of bare numbers is a list where a column of ordinals is a
 *  league. The block takes the subject's colour where one is scoped —
 *  `--cm-index` is re-pointed by a team's or a club's shell — so the same cell
 *  is the division's blue on a competition screen and the club's own on its. */
export function IndexCell({ children }: { children: ReactNode }) {
  return (
    <td className="cm-index numeric px-1.5 text-center text-2xs font-bold">{children}</td>
  );
}

/** The name cell's link on a board row.
 *
 *  A class string rather than a component, on `TableHeads.PLATE`'s precedent:
 *  the three callers wrap different things — a fantasy badge, a club crest, a
 *  portrait — and pass their own trailing classes, so a component here would
 *  own nothing but a string and would need a `className` prop to hand it back.
 *
 *  `min-h-11` AND `.cm-row`, which is the documented pair rather than belt and
 *  braces: `desk.css` says in as many words that "`.cm-row` says nothing below
 *  `lg`, and that is the whole design" — the phone's 44px tap floor is the
 *  `min-h-11`, and the class takes over at `lg` to bring the row down to CM's
 *  28. Dropping the `min-h` took every row on a 390 phone to 32px, which
 *  `tapfit` caught as 50 under-floor targets in one sweep. */
export const ROW_LINK =
  "cm-row flex min-h-11 items-center gap-2 text-base font-bold hover:underline lg:text-lg";
