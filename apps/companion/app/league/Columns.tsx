import Link from "next/link";
import type { SortKey } from "@epl/core";
import { sortHref } from "./sort";
import { Head, HeadRow, NameHead, PLATE } from "../components/league/TableHeads";

// The table's column heads, in one place because two files print them: the page
// and the skeleton it waits behind. They were written out twice, and on 29 Aug
// only one of the two copies stopped saying W-L-T — so a reader saw the old
// heading over the new numbers for as long as Fantrax took to answer.
//
// **Bevelled buttons, which is the thing CM tables are remembered for.** They
// were flat until Craig looked at the first attempt and said it looked nothing
// like the game, and he was right: the bevel is not decoration on a CM table, it
// is what a CM table IS. It is drawn as a button because it behaves as one — the
// sorted column is drawn pressed, so the affordance and the state are one object.
//
// The Team head keeps the bevel and is not a link. The bevelled strip is one
// object in CM — a header row with a gap cut in it stops reading as a strip —
// and this cell is a part of it rather than a button pretending to be one: it
// has no hover, no arrow and no href, which is the difference between a surface
// and a control. Sorting by name is not offered because a league table is not
// read alphabetically.

type Column = {
  key: SortKey | "team" | "form";
  label: string;
  title: string | undefined;
  align: "left" | "center" | "right";
  width: string;
};

/** One column, and the list is what `colSpan` counts — a rule drawn across the
 *  table needs to know how wide the table is, and a literal 8 here is a number
 *  that goes wrong the day a column is added. It went from eight to ten on
 *  31 Aug 2026, which is the day that mattered.
 *
 *  **A football league table, which is what `cm9900/24.jpg` prints.** Its header
 *  reads `Pld Won Drn Lst For Ag Pts` and so does every table in an English
 *  newspaper; this is that row, plus the form guide a modern one carries.
 *
 *  What went, and why each was a Fantrax habit rather than a column:
 *
 *  · **`W-D-L`** was three numbers crushed into one cell. A football table gives
 *    each its own column, and a combined cell can only ever be sorted by one of
 *    the three — this one silently sorted by wins under a head that named all
 *    three.
 *  · **`GB`** — games back, half a game per win the leader is ahead. A baseball
 *    convention, in a sport with draws in it, in a league paying three for a win.
 *    It was also the only column the standings PAGE does not publish, so losing
 *    it took a second provider read out of `/league` and out of the edition
 *    writer with it.
 *  · **`Win%`** — a baseball-style proportion set `.500`, which is not a
 *    percentage, needed a paragraph to explain, and says less than `W D L` says
 *    in three narrower columns.
 *
 *  And `FP` became `For`. It is the same number; a league table calls what you
 *  scored `For`, and the Fantrax abbreviation was the last of the vocabulary. */
export const COLUMNS: readonly Column[] = [
  { key: "rank", label: "#", title: "Fantrax's own order", align: "center", width: "w-8 lg:w-14" },
  { key: "team", label: "Team", title: undefined, align: "left", width: "" },
  { key: "played", label: "Pld", title: "Played — won, drawn and lost added up", align: "center", width: "w-8 lg:w-20" },
  { key: "won", label: "W", title: "Won", align: "center", width: "w-7 lg:w-16" },
  { key: "drawn", label: "D", title: "Drawn", align: "center", width: "w-7 lg:w-16" },
  { key: "lost", label: "L", title: "Lost", align: "center", width: "w-7 lg:w-16" },
  { key: "for", label: "For", title: "Fantasy points scored — Fantrax's FPtsF", align: "center", width: "w-11 lg:w-24" },
  { key: "against", label: "Ag", title: "Fantasy points conceded — Fantrax's FPtsA", align: "center", width: "w-11 lg:w-24" },
  { key: "pts", label: "Pts", title: "League points — the commissioner's own, never counted here", align: "center", width: "w-10 lg:w-24" },
  { key: "form", label: "Form", title: "The last five rounds, oldest first", align: "center", width: "w-14 lg:w-32" },
];

/** Where a column's content sits, as a flex class and as a text class.
 *
 *  **Centred, which is what `cm9900/24.jpg` does** (Craig, 31 Aug). Every figure
 *  in the game's table is centred under a centred head, and ours were flushed
 *  right — a spreadsheet habit that reads as one. It matters most now that the
 *  columns are narrow: `W` `D` `L` are one digit each, and a single digit jammed
 *  against its right edge under a centred `W` is the arrangement that made the
 *  strip look mis-set. The name stays left, because a name is read and not
 *  compared. */
const JUSTIFY = { left: "justify-start", center: "justify-center", right: "justify-end" } as const;
const TEXT = { left: "text-left", center: "text-center", right: "text-right" } as const;

/** The cell class for a column, so the row prints the same alignment the head
 *  does. Exported because `TableRow` is the other half of this table and the two
 *  drifting apart is exactly what the shared `COLUMNS` list exists to stop. */
export function cellAlign(key: Column["key"]): string {
  return TEXT[COLUMNS.find((column) => column.key === key)?.align ?? "center"];
}

/** A column the reader can order by. `form` is a run of letters and `team` a
 *  name, and neither is a quantity. */
function sortable(key: Column["key"]): key is SortKey {
  return key !== "team" && key !== "form";
}

export default function Columns({
  sort,
  descending,
}: {
  sort: SortKey;
  descending: boolean;
}) {
  return (
    <thead>
      <HeadRow>
        {COLUMNS.map((column) => {
          const here = sortable(column.key) && column.key === sort;
          // The name column has no plate, and `NameHead` is that cell.
          if (column.key === "team") return <NameHead key={column.key} label={column.label} />;
          return (
            <Head
              key={column.key}
              width={column.width}
              title={column.title}
              sorted={here ? (descending ? "descending" : "ascending") : undefined}
            >
              {sortable(column.key) ? (
                <Link
                  href={sortHref(column.key, sort, descending)}
                  className={`flex h-7 items-center gap-0.5 whitespace-nowrap px-1.5 ${
                    JUSTIFY[column.align]
                  } ${here ? "cm-bevel-pressed" : "cm-bevel hover:brightness-110"}`}
                >
                  {column.label}
                  {here ? <Arrow down={descending} /> : null}
                </Link>
              ) : (
                <span className={PLATE}>{column.label}</span>
              )}
            </Head>
          );
        })}
      </HeadRow>
    </thead>
  );
}

function Arrow({ down }: { down: boolean }) {
  return (
    <span aria-hidden className="text-[0.5rem] leading-none">
      {down ? "▼" : "▲"}
    </span>
  );
}
