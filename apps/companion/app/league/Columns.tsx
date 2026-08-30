import Link from "next/link";
import type { SortKey } from "@epl/core";
import { sortHref } from "./sort";

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
  align: "left" | "right";
  width: string;
};

/** One column, and the list is what `colSpan` counts — a rule drawn across the
 *  table needs to know how wide the table is, and a literal 8 here is a number
 *  that goes wrong the day a column is added. */
export const COLUMNS: readonly Column[] = [
  { key: "rank", label: "#", title: "Fantrax's own order", align: "right", width: "w-8 lg:w-12" },
  { key: "team", label: "Team", title: undefined, align: "left", width: "" },
  { key: "record", label: "W-D-L", title: "Won, drawn, lost", align: "right", width: "w-[4.5rem] lg:w-28" },
  { key: "form", label: "Form", title: "The last five rounds, oldest first", align: "right", width: "w-16 lg:w-24" },
  { key: "gb", label: "GB", title: "Games back — how far behind the leader", align: "right", width: "w-11 lg:w-20" },
  { key: "win", label: "Win%", title: "Win fraction as Fantrax sets it: 1.000 is every game", align: "right", width: "w-14 lg:w-24" },
  { key: "fp", label: "FP", title: "Fantasy points scored, Fantrax's own total", align: "right", width: "w-14 lg:w-24" },
  { key: "pts", label: "Pts", title: "League points — the commissioner's own, never counted here", align: "right", width: "w-11 lg:w-20" },
];

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
      <tr className="text-3xs uppercase tracking-wide">
        {COLUMNS.map((column) => {
          const here = sortable(column.key) && column.key === sort;
          return (
            <th
              key={column.key}
              scope="col"
              title={column.title}
              aria-sort={here ? (descending ? "descending" : "ascending") : undefined}
              className={`p-0 font-bold ${column.width}`}
            >
              {sortable(column.key) ? (
                <Link
                  href={sortHref(column.key, sort, descending)}
                  className={`flex h-7 items-center justify-end gap-0.5 whitespace-nowrap px-1.5 ${
                    here ? "cm-bevel-pressed text-accent" : "cm-bevel text-muted hover:text-ink"
                  }`}
                >
                  {column.label}
                  {here ? <Arrow down={descending} /> : null}
                </Link>
              ) : (
                <span className="cm-bevel flex h-7 items-center whitespace-nowrap px-1.5 text-muted">
                  {column.label}
                </span>
              )}
            </th>
          );
        })}
      </tr>
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
