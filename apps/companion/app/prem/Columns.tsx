import type { TableSortKey } from "@epl/core";
import { tableHref } from "./sort";
import { Head, HeadRow, NameHead, PLATE, SortHead, sortedAs } from "../components/league/TableHeads";
import { TEXT, standDown } from "@/app/desk";

// The table's column heads, shared by the page and its skeleton so the two cannot drift.

type Column = {
  key: TableSortKey | "club" | "form";
  label: string;
  title: string | undefined;
  align: "left" | "center";
  width: string;
  /** A column the phone does without, so the last one — the column the table is
   *  FOR — fits at 390 without a sideways scroll. */
  deskOnly?: true;
  /** A column whose head is blank because the column names itself —
   *  `TableHeads.MUTE`, and `league/Columns` for the same pair. */
  mute?: true;
};

/** Every column, in order; a cut line's `colSpan` counts this list rather than a literal. */
export const COLUMNS: readonly Column[] = [
  { key: "place", label: "Place", title: "Where the competition puts them", align: "center", width: "w-8 lg:w-14", mute: true },
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

/** The cell class for a column, so `ClubRow` aligns each cell as its head does. */
export function cellAlign(key: Column["key"]): string {
  return TEXT[COLUMNS.find((column) => column.key === key)?.align ?? "center"];
}

/** Hides a desk-only column on a phone, unless the table is sorted by it and needs its head. */
export function deskOnly(key: Column["key"], sort: TableSortKey): string {
  const column = COLUMNS.find((entry) => entry.key === key);
  return standDown(column?.deskOnly, key === sort);
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
              mute={column.mute}
              sorted={sortedAs(here, descending)}
            />
          );
        })}
      </HeadRow>
    </thead>
  );
}
