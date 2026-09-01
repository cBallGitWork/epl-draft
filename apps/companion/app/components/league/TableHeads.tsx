import type { ReactNode } from "react";

// The bevelled head strip both league tables print.
//
// `Columns.tsx:5-8` records the bug this file exists to end: the league table's
// heads were written out twice, and on 29 Aug only one of the two copies stopped
// saying `W-L-T`, so a reader saw the old heading over the new numbers for as
// long as Fantrax took to answer. Team Stats then hand-rolled the whole strip a
// third time — two of its class strings character-identical to the ones in
// `Columns.tsx` — which is the same fault with the same ending waiting.
//
// **What is shared is the STRIP, not the columns.** The two tables have
// different column counts and therefore genuinely different `lg:` widths, so
// `COLUMNS` (10 entries, sortable, with an align per column) and `HEADS` (6,
// static, all centred) stay where they are. Merging those lists needs a
// per-table override, which is a parameter added for a second caller — what
// CODE_RULES §2 calls speculative framework code. What moves here is the
// mechanics every CM head strip shares whatever it is heading: the row, the
// cell, the plate, and the bare name cell that starts it.
//
// **The plate is a button because a CM head IS one** — the bevel is not
// decoration on a CM table, it is what the table is remembered for, and the
// sorted column is drawn pressed so the affordance and the state are one object.
// `Columns.tsx` keeps the pressed variant and the link branch, because only one
// of the two tables sorts.

/** The head row itself. `text-3xs uppercase` is the strip's own type and the
 *  cells inherit it, which is why it sits here rather than on each `<th>`. */
export function HeadRow({ children }: { children: ReactNode }) {
  return <tr className="text-3xs uppercase">{children}</tr>;
}

/** One head cell. `p-0` because the plate inside it carries the padding — a
 *  bevelled button inset by cell padding is a button with a gap around it, and
 *  the strip stops reading as one object. */
export function Head({
  width,
  title,
  sorted,
  children,
}: {
  width: string;
  title?: string | undefined;
  /** Set only by a sortable table, and only on the column in force. */
  sorted?: "ascending" | "descending" | undefined;
  /** Absent on a spacer column — a `<th>` with nothing in it, which is how a
   *  table holds a gap open without a plate floating in it. */
  children?: ReactNode;
}) {
  return (
    <th
      scope="col"
      title={title}
      aria-sort={sorted}
      className={`p-0 font-bold ${width}`}
    >
      {children}
    </th>
  );
}

/** The bevelled plate. Centred: every figure in `cm9900/24.jpg` is centred under
 *  a centred head, and a single digit jammed against its right edge under a
 *  centred `W` is what made the first strip look mis-set. */
export const PLATE = "cm-bevel flex h-7 items-center justify-center whitespace-nowrap px-1.5";

/** The name column's head, which carries no plate.
 *
 *  CM's head strip starts at the first figure and leaves the name column bare
 *  (`cm9900/24.jpg`) — the strip is a ruler over the numbers, and running it
 *  across the names makes it a header bar instead. */
export function NameHead({ label }: { label: string }) {
  return (
    <Head width="">
      <span className="flex h-7 items-center px-1.5 text-faint">{label}</span>
    </Head>
  );
}
