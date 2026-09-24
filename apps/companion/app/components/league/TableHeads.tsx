import type { ReactNode } from "react";
import Link from "next/link";

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
//
// *This file used to keep the pressed variant and the link branch out, "because
// only one of the two tables sorts". Three of them sort now — `/league`, `/prem`
// and the Team Stats board, the third having hand-rolled the plate with two
// class strings character-identical to the other two. So `SortHead` is here,
// which is CODE_RULES §1's third occurrence arriving exactly as it says it
// will: the third use is what tells you what actually varies, and it was the
// alignment and the arrow.*

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

/** **A head the column does not need.**
 *
 *  Craig, 10 Sep 2026: *"the rank (blue tabs) does not need a column header
 *  (hashtag) / remove team / repeat this for all tables the same."* A column of
 *  `1st 2nd 3rd` says what it is, and so does a column of names with a crest on
 *  each. Those are the two columns in the table that label themselves, and they
 *  were the two carrying a label — `cm9900/24.jpg` heads neither, and starts its
 *  strip at the first figure.
 *
 *  **The word goes silent rather than away.** A `<th scope="col">` with nothing
 *  in it is a column whose every cell is announced with no header, and on the
 *  two sortable placings the same text is the accessible NAME of a link. So it
 *  stays in the tree and leaves the strip, which is what `sr-only` is for. The
 *  plate around it does not move: it is sized by the `<th>`, so an empty one
 *  still holds the strip's height and the column's width.
 *
 *  A constant and not a component, on `PLATE`'s precedent. **Ten tables mute a
 *  head and an eleventh is one of their loading skeletons**, counted 10 Sep
 *  2026 — `/league`, `/prem`, both Team Stats boards, the club squad list, the
 *  club and squad stat boards, the season grid, a match's player stats and the
 *  pool — and between them they wrap the word in **seven** different things:
 *  `SortHead`'s link, `NameHead`'s bare span, `PLATE`, `HEAD_PLATE`,
 *  `HEAD_PLATE_END`, the pool's own sticky lead cell and its skeleton's plain
 *  `<th>`. A component spanning those takes a wrapper, a width and an element,
 *  which is CODE_RULES §1's "never build a generic mechanism". What they share
 *  is this one class. */
export const MUTE = "sr-only";

/** Where a sortable head's label sits inside its plate. The figures are centred
 *  — every one in `cm9900/24.jpg` is, under a centred head — and a name is read
 *  rather than compared, so it stays left. */
const JUSTIFY = { left: "justify-start", center: "justify-center", right: "justify-end" } as const;

/** A head cell the reader can order by: the bevelled plate as a LINK, drawn
 *  pressed when the table is ordered by it.
 *
 *  A link and not a click handler, for the reason both `sort.ts` files record —
 *  the server does the ordering, the phone gets HTML, and the ordering survives
 *  being shared. Which is why the href is a prop: each table spells its own
 *  query, and the two that do it identically are two, which §1 leaves alone.
 *
 *  `gap-0.5` is unconditional and costs a head with no arrow nothing — a gap
 *  needs two children to appear. */
export function SortHead({
  width,
  title,
  href,
  label,
  align = "center",
  sorted,
  arrow = true,
  mute = false,
  compact = false,
}: {
  width: string;
  title?: string | undefined;
  href: string;
  label: string;
  align?: "left" | "center" | "right";
  /** Which way the table is ordered by THIS column, or undefined when it is not
   *  the column in force. Drives the pressed plate, `aria-sort` and the arrow
   *  together, so the three can never disagree — which they did on `/players`
   *  before `activeSort` resolved them in one place. */
  sorted?: "ascending" | "descending" | undefined;
  /** Off for a head that is one of a pair of MEASURES rather than one of a row
   *  of columns. Team Stats' FPts/Total heads are both always descending, so an
   *  arrow there would state a direction the reader cannot change and the
   *  pressed plate has already said everything true. */
  arrow?: boolean;
  /** On for a column that names itself — see `MUTE` above. The plate, the
   *  pressed state and the arrow all stay; the word goes silent. */
  mute?: boolean;
  /** 24px and nearly unpadded under a thumb, so a narrow column is set by its figures, not its head. */
  compact?: boolean;
}) {
  return (
    <Head width={width} title={title} sorted={sorted}>
      <Link
        href={href}
        className={`flex items-center gap-0.5 whitespace-nowrap ${compact ? COMPACT : "h-7 px-1.5"} ${JUSTIFY[align]} ${
          sorted === undefined ? "cm-bevel hover:brightness-110" : "cm-bevel-pressed"
        }`}
      >
        {mute ? <span className={MUTE}>{label}</span> : label}
        {arrow && sorted !== undefined ? <Arrow down={sorted === "descending"} /> : null}
      </Link>
    </Head>
  );
}

const COMPACT = "h-6 min-w-6 px-0.5 lg:h-7 lg:px-1.5";

function Arrow({ down }: { down: boolean }) {
  return (
    <span aria-hidden className="text-[0.5rem] leading-none">
      {down ? "▼" : "▲"}
    </span>
  );
}

/** The name column's head, which carries no plate and now no word either.
 *
 *  CM's head strip starts at the first figure and leaves the name column bare
 *  (`cm9900/24.jpg`) — the strip is a ruler over the numbers, and running it
 *  across the names makes it a header bar instead. The cell stays, because it
 *  holds the column open and keeps the strip's height. */
export function NameHead({ label }: { label: string }) {
  return (
    <Head width="">
      <span className="flex h-7 items-center px-1.5">
        <span className={MUTE}>{label}</span>
      </span>
    </Head>
  );
}
