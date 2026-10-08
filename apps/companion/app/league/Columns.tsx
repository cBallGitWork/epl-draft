import type { SortKey } from "@epl/core";
import { sortHref } from "./sort";
import { Head, HeadRow, NameHead, PLATE, SortHead, sortedAs } from "../components/league/TableHeads";
import { DESK_ONLY, TEXT, standDown } from "@/app/desk";
import { FORM_GAMES } from "../config";

// The table's column heads, shared by the page and the head-to-head: bevelled plates, the sorted one
// pressed, and no plate over the names (`cm9900/24.jpg`), which are not sortable.

type Column = {
  key: SortKey | "team" | "form";
  label: string;
  title: string | undefined;
  align: "left" | "center";
  width: string;
  /** A column the phone does without, so the table fits at 390 without a sideways scroll. */
  deskOnly?: true;
  /** Which of Pts' two copies this is: a phone reads it straight after Pld, a desk at the end. */
  copy?: keyof typeof COPY;
  /** A head left blank because the column names itself; the label still reaches a screen reader. */
  mute?: true;
};

const PTS_TITLE = "League points — the commissioner's own, never counted here";

/** Where each copy of Pts shows. A table cell cannot be reordered by CSS, so Pts is printed twice. */
export const COPY = { phone: "lg:hidden", desk: DESK_ONLY } as const;

/** A football table's row (`cm9900/24.jpg`) plus form; the list is what `colSpan` counts, a hidden cell spanning zero. */
export const COLUMNS: readonly Column[] = [
  { key: "rank", label: "Placing", title: "Fantrax's own order", align: "center", width: "w-8 lg:w-14", mute: true },
  { key: "team", label: "Team", title: undefined, align: "left", width: "" },
  { key: "played", label: "Pld", title: "Played — won, drawn and lost added up", align: "center", width: "w-8 lg:w-20" },
  { key: "pts", label: "Pts", title: PTS_TITLE, align: "center", width: "w-10", copy: "phone" },
  { key: "won", label: "W", title: "Won", align: "center", width: "w-7 lg:w-16" },
  { key: "drawn", label: "D", title: "Drawn", align: "center", width: "w-7 lg:w-16" },
  { key: "lost", label: "L", title: "Lost", align: "center", width: "w-7 lg:w-16" },
  { key: "for", label: "For", title: "Fantasy points scored — Fantrax's FPtsF", align: "center", width: "w-11 lg:w-24" },
  { key: "against", label: "Ag", title: "Fantasy points conceded — Fantrax's FPtsA", align: "center", width: "w-11 lg:w-24", deskOnly: true },
  { key: "pts", label: "Pts", title: PTS_TITLE, align: "center", width: "w-10 lg:w-24", copy: "desk" },
  { key: "form", label: "Form", title: `The last ${FORM_GAMES} gameweeks, oldest first`, align: "center", width: "w-14 lg:w-32", deskOnly: true },
];

/** A column's cell alignment, so a row sits as its head: figures centred (`cm9900/24.jpg`, Craig, 31 Aug), a name left. */
export function cellAlign(key: Column["key"]): string {
  return TEXT[COLUMNS.find((column) => column.key === key)?.align ?? "center"];
}

/** Whether a column stands down under a thumb: never when it orders the table, or the sort loses its arrow and `aria-sort`. */
export function deskOnly(key: Column["key"], sort: SortKey): string {
  const column = COLUMNS.find((entry) => entry.key === key);
  return standDown(column?.deskOnly, key === sort);
}

/** The width class a column shows at: its copy's, else `deskOnly`'s. */
function shownAt(column: Column, sort: SortKey): string {
  return column.copy === undefined ? deskOnly(column.key, sort) : COPY[column.copy];
}

/** A React key for a column, unique though Pts appears twice. */
function columnKey(column: Column): string {
  return column.copy === undefined ? column.key : `${column.key}-${column.copy}`;
}

/** A column the reader can order by: form and team are not quantities. */
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
          // The name column has no plate, and `NameHead` is that cell.
          if (column.key === "team") return <NameHead key={column.key} label={column.label} />;
          if (!sortable(column.key)) {
            return (
              <Head
                key={columnKey(column)}
                width={`${column.width} ${shownAt(column, sort)}`}
                title={column.title}
              >
                <span className={PLATE}>{column.label}</span>
              </Head>
            );
          }
          const here = column.key === sort;
          return (
            <SortHead
              key={columnKey(column)}
              width={`${column.width} ${shownAt(column, sort)}`}
              title={column.title}
              align={column.align}
              href={sortHref(column.key, sort, descending)}
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
