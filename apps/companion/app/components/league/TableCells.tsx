import type { ReactNode } from "react";
import { INDEX_WIDTH, MINOR_LABEL } from "@/app/desk";

// The two cells a CM board's rows are built from, opposite `TableHeads`.
//
// Both arrived at three occurrences and not before. The index block was written
// out verbatim in `league/team-stats`, `prem/team-stats` and `players/Board`
// (deleted 6 Sep 2026);
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
export function IndexCell({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <td className={`cm-index ${INDEX_WIDTH} numeric px-1.5 text-center ${className}`}>{children}</td>;
}

/* `INDEX_WIDTH` lived here and is in `app/desk.ts` now — its second consumer is
   `shell/ScoreRow`, and a `shell/` component importing from `league/` inverts
   CODE_RULES §4's layering. The docblock there carries the measurement and the
   reason. */

/** The name cell's link on a board row.
 *
 *  A class string rather than a component, on `TableHeads.PLATE`'s precedent:
 *  the three callers wrap different things — a team name, a club crest, a
 *  portrait — and pass their own trailing classes, so a component here would
 *  own nothing but a string and would need a `className` prop to hand it back.
 *
 *  `min-h-11` AND `.cm-row`, which is the documented pair rather than belt and
 *  braces: `desk.css` says in as many words that "`.cm-row` says nothing below
 *  `lg`, and that is the whole design" — the phone's 44px tap floor is the
 *  `min-h-11`, and the class takes over at `lg` to bring the row down to CM's
 *  28. Dropping the `min-h` took every row on a 390 phone to 32px, which
 *  `tapfit` caught as 50 under-floor targets in one sweep. */
export const ROW_LINK = "cm-row flex min-h-11 items-center gap-2 hover:underline";

/** The points in a block of their own, the way CM ends its table: the eye runs down the column to find them. */
export function PointsCell({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <td className={`p-0 ${className}`}>
      <span className="cm-index numeric flex min-h-7 items-center justify-center px-1.5">{children}</span>
    </td>
  );
}

/** A dashed rule across a table naming what it separates. `tone` is the rule's border colour, written out in full. */
export function CutRow({ span, label, tone }: { span: number; label: string; tone: string }) {
  return (
    <tr aria-hidden>
      <td colSpan={span} className="p-0">
        <span className={`flex items-center gap-2 py-1.5 ${MINOR_LABEL}`}>
          <span className={`flex-1 border-t border-dashed ${tone}`} />
          {label}
          <span className={`flex-1 border-t border-dashed ${tone}`} />
        </span>
      </td>
    </tr>
  );
}
