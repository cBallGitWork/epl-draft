import Link from "next/link";
import type { TableSortKey } from "@epl/core";
import { tableHref } from "./sort";
import { Head, HeadRow, NameHead, PLATE } from "../components/league/TableHeads";

// The table's column heads, in one place because two files print them: the page
// and the skeleton it waits behind. `league/Columns.tsx` records the bug that
// rule exists to stop — its heads were written out twice and only one copy was
// corrected, so a reader saw the old heading over the new numbers.
//
// **A football league table, which is what `cm9900/24.jpg` prints.** Its header
// reads `Pld Won Drn Lst For Ag Pts` and so does every table in an English
// newspaper. This is that row plus GD, which the game leaves out and which the
// Premier League orders on — a table whose second tiebreak is invisible is a
// table a reader cannot check.
//
// The mechanics are `components/league/TableHeads`: the strip, the cell and the
// plate are shared with the draft table, and the column LIST is not, because the
// two tables have different columns and therefore different widths.

type Column = {
  key: TableSortKey | "club" | "form";
  label: string;
  title: string | undefined;
  align: "left" | "center" | "right";
  width: string;
};

/** One column, and the list is what `colSpan` counts — a rule drawn across the
 *  table has to know how wide the table is, and a literal here is a number that
 *  goes wrong the day a column is added. */
export const COLUMNS: readonly Column[] = [
  { key: "place", label: "#", title: "Where the competition puts them", align: "center", width: "w-8 lg:w-14" },
  { key: "club", label: "Club", title: undefined, align: "left", width: "" },
  { key: "played", label: "Pld", title: "Played — won, drawn and lost added up", align: "center", width: "w-8 lg:w-20" },
  { key: "won", label: "Won", title: "Won", align: "center", width: "w-8 lg:w-16" },
  { key: "drawn", label: "Drn", title: "Drawn", align: "center", width: "w-8 lg:w-16" },
  { key: "lost", label: "Lst", title: "Lost", align: "center", width: "w-8 lg:w-16" },
  { key: "for", label: "For", title: "Goals scored", align: "center", width: "w-9 lg:w-20" },
  { key: "against", label: "Ag", title: "Goals conceded", align: "center", width: "w-9 lg:w-20" },
  { key: "gd", label: "GD", title: "Goal difference — the competition's first tiebreak", align: "center", width: "w-10 lg:w-20" },
  { key: "pts", label: "Pts", title: "Three for a win, one for a draw", align: "center", width: "w-10 lg:w-24" },
  { key: "form", label: "Form", title: "The last five, oldest first", align: "center", width: "w-14 lg:w-32" },
];

/** Where a column's content sits, as a flex class and as a text class. Centred,
 *  which is what `cm9900/24.jpg` does — every figure in the game's table is
 *  centred under a centred head. The name stays left, because a name is read and
 *  not compared. */
const JUSTIFY = { left: "justify-start", center: "justify-center", right: "justify-end" } as const;
const TEXT = { left: "text-left", center: "text-center", right: "text-right" } as const;

/** The cell class for a column, so the row prints the same alignment the head
 *  does. Exported because `ClubRow` is the other half of this table, and the two
 *  drifting apart is what the shared `COLUMNS` list exists to stop. */
export function cellAlign(key: Column["key"]): string {
  return TEXT[COLUMNS.find((column) => column.key === key)?.align ?? "center"];
}

/** A column the reader can order by. `form` is a run of letters and `club` a
 *  name, and neither is a quantity. */
function sortable(key: Column["key"]): key is TableSortKey {
  return key !== "club" && key !== "form";
}

export default function Columns({
  sort,
  descending,
}: {
  sort: TableSortKey;
  descending: boolean;
}) {
  return (
    <thead>
      <HeadRow>
        {COLUMNS.map((column) => {
          const here = sortable(column.key) && column.key === sort;
          // The name column has no plate, and `NameHead` is that cell.
          if (column.key === "club") return <NameHead key={column.key} label={column.label} />;
          return (
            <Head
              key={column.key}
              width={column.width}
              title={column.title}
              sorted={here ? (descending ? "descending" : "ascending") : undefined}
            >
              {sortable(column.key) ? (
                <Link
                  href={tableHref(column.key, sort, descending)}
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
