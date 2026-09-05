import type { TableSortKey } from "@epl/core";
import { tableHref } from "./sort";
import { Head, HeadRow, NameHead, PLATE, SortHead } from "../components/league/TableHeads";
import { TEXT } from "@/app/desk";

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
  /** A column the phone does without, so the last one — the column the table is
   *  FOR — fits at 390 without a sideways scroll. */
  deskOnly?: true;
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
  { key: "for", label: "For", title: "Goals scored", align: "center", width: "w-9 lg:w-20", deskOnly: true },
  { key: "against", label: "Ag", title: "Goals conceded", align: "center", width: "w-9 lg:w-20", deskOnly: true },
  { key: "gd", label: "GD", title: "Goal difference — the competition's first tiebreak", align: "center", width: "w-10 lg:w-20" },
  { key: "pts", label: "Pts", title: "Three for a win, one for a draw", align: "center", width: "w-10 lg:w-24" },
  { key: "form", label: "Form", title: "The last five, oldest first", align: "center", width: "w-14 lg:w-32", deskOnly: true },
];

/** The cell class for a column, so the row prints the same alignment the head
 *  does. Exported because `ClubRow` is the other half of this table, and the two
 *  drifting apart is what the shared `COLUMNS` list exists to stop. */
export function cellAlign(key: Column["key"]): string {
  return TEXT[COLUMNS.find((column) => column.key === key)?.align ?? "center"];
}

/** Whether this column stands down under a thumb — unless the table is ORDERED
 *  by it. `league/Columns` carries the long form of the argument; the short one
 *  is that `display: none` takes the pressed plate, the arrow and `aria-sort`
 *  out with the column, so a phone on a shared `?sort=for` link would show an
 *  order with no visible author. */
export function deskOnly(key: Column["key"], sort: TableSortKey): string {
  const column = COLUMNS.find((entry) => entry.key === key);
  return column?.deskOnly && key !== sort ? "hidden lg:table-cell" : "";
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
          // The name column has no plate, and `NameHead` is that cell.
          if (column.key === "club") return <NameHead key={column.key} label={column.label} />;
          if (!sortable(column.key)) {
            return (
              <Head
                key={column.key}
                width={`${column.width} ${deskOnly(column.key, sort)}`}
                title={column.title}
              >
                <span className={PLATE}>{column.label}</span>
              </Head>
            );
          }
          const here = column.key === sort;
          return (
            <SortHead
              key={column.key}
              width={`${column.width} ${deskOnly(column.key, sort)}`}
              title={column.title}
              align={column.align}
              href={tableHref(column.key, sort, descending)}
              label={column.label}
              sorted={here ? (descending ? "descending" : "ascending") : undefined}
            />
          );
        })}
      </HeadRow>
    </thead>
  );
}
