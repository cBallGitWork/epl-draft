// The table's column heads, in one place because two files print them: the page
// and the skeleton it waits behind. They were written out twice, and on 29 Aug
// only one of the two copies stopped saying W-L-T — so a reader saw the old
// heading over the new numbers for as long as Fantrax took to answer.
//
// **Bevelled, which is the thing CM tables are remembered for.** The heads were
// flat until Craig looked at the first attempt and said it looked nothing like
// the game; the bevel is not decoration on a CM table, it is what a CM table IS.
//
// The bevel goes on a block INSIDE the cell, with `p-0` on the `<th>`. A table
// this app draws is `border-collapse: collapse`, which merges adjacent borders
// and lets one of the pair win — so a bevel painted straight onto a `<th>` loses
// its inner light and dark edges and stops being a bevel at all.

type Column = {
  key: string;
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

export default function Columns() {
  return (
    <thead>
      <tr className="text-3xs uppercase">
        {COLUMNS.map((column) => (
          <th key={column.key} scope="col" title={column.title} className={`p-0 font-bold ${column.width}`}>
            <span
              className={`cm-bevel flex h-7 items-center whitespace-nowrap px-1.5 ${
                column.align === "left" ? "justify-start" : "justify-end"
              }`}
            >
              {column.label}
            </span>
          </th>
        ))}
      </tr>
    </thead>
  );
}
