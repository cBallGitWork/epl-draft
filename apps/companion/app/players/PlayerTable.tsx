import type { PoolRow } from "./pool";
import { type PoolColumn } from "./columns";
import { HeadRow, MUTE, SortHead } from "../components/league/TableHeads";
import { activeSort, sortHref } from "./query";
import type { PlayersQuery } from "./query";
import { ROW_RULE, SCROLL } from "@/app/desk";
import Cell, { STICKY_LEAD } from "./Cell";

// The pool as a table — and since 6 Sep 2026 as the WHOLE table (Craig: *"the
// landing screen for scout should really be showing as many columns as possible
// like Fantrax"*). Twenty-four columns, every one sortable, ordered as Fantrax
// orders its own.
//
// Sorting is a link, not a click handler: the server does the ordering, the
// phone gets HTML, and the sort survives being shared.
//
// It is the second shape in DESIGN §2's rule and the clearest example of it: a
// table whose last column is what the table is FOR drops columns to fit a phone,
// and a many-measure DIRECTORY keeps every one and scrolls sideways with CM's
// own bevelled bar, because there is no last column that matters more than the
// rest and hiding any of them is choosing for the reader.
//
// **The name column is frozen** (DESIGN §9, decided 29 Aug 2026): twenty
// columns on a 390 phone means the figures are read with the man's name off
// screen, which is a table answering "23" to no question.

export default function PlayerTable({
  rows,
  columns,
  query,
  teamNames,
  raw,
  rated,
  cuts,
}: {
  rows: readonly PoolRow[];
  /** The columns this plate shows — the spine plus one group's, or all
   *  twenty. **Passed in rather than read off `COLUMNS` here**, because the
   *  page has already worked the set out to compute the cuts against it, and a
   *  table that decided its own columns could draw a mark for a column it is not
   *  drawing. */
  columns: readonly PoolColumn[];
  query: PlayersQuery;
  teamNames: Map<string, string>;
  /** The grouped payload's raw counts, by Fantrax id. Absent for a man that
   *  read did not carry, which is ordinary and prints a dash. */
  raw: Map<string, Record<string, number | null>>;
  /** Whether the counts are drawn per ninety minutes. */
  rated: boolean;
  /** What a figure must reach to be lit, by column key. */
  cuts: Map<string, number | null>;
}) {
  const current = activeSort(query);
  return (
    // `cm-scroll` for the bar, on the wrapper rather than on the table, so the
    // header row scrolls with its body.
    //
    // **`bg-surface` — the board is OPAQUE, and it is the only table in the app
    // that has to be** (Craig, 10 Sep 2026: *"also it needs to be opaque too"*).
    // `.cm-panel` is deliberately 88% and its docblock defends the choice well:
    // CM's own panels let the match photograph read faintly through, and at 88%
    // the picture contributes about four parts in 255, so the ink ladder is
    // still the one DESIGN §3 measured. That argument holds for a ten-row
    // standings table set in `text-base`. It does not hold here. This board is
    // twenty columns of `text-2xs` figures, and the photograph behind it is
    // not an average — it has a white crowd and a red hoarding in it, which is
    // 12% of something bright rather than 12% of the mean, arriving under the
    // smallest type on the desk.
    //
    // The tell was already on screen before Craig named it: `STICKY_LEAD` has
    // carried an opaque `bg-surface` since the name column was frozen, so the
    // board was rendering with a solid first column and nineteen translucent
    // ones — the panel disagreeing with itself down a visible seam.
    //
    // The same colour the panel is mixing FROM, so nothing shifts but the
    // photograph going away.
    <div className={`cm-scroll bg-surface ${SCROLL}`}>
      <table className="w-full border-collapse text-sm">
        <thead>
          {/* **The shared head strip, not a fifth spelling of it** (Craig, 6 Sep
              2026: *"where are the column headers using a grey box that can be
              selected. Another instance of us using different code for 6
              different tables"*). This drew a bare `<th>` with a link and an
              arrow in it, so the one table in the app with twenty sortable
              columns was the one with no bevelled plate on any of them — and CM's
              head plate is not decoration, it is what the table is remembered
              for. `TableHeads` already owned the mechanics for the three tables
              that sort; this is the fourth, and the plate, the pressed state,
              `aria-sort` and the arrow now come from one place for all of them. */}
          <HeadRow>
            {columns.map((column) =>
              column.key === "name" ? (
                // `NameHead`'s markup written out rather than imported, because
                // this head has to carry `STICKY_LEAD` and that component takes
                // no class — it is the bare name cell CM's strip starts with
                // (`cm9900/24.jpg`: the ruler runs over the numbers, not the
                // names). Two occurrences of one line, which §1 leaves alone;
                // the third takes a class prop. The WORD is `MUTE` for the same
                // reason it is on every other name column, and the class comes
                // from the component this copies rather than being spelled out
                // again — a copied line that drifts on the one thing it is
                // about is the failure `TableHeads` exists to stop.
                <th key={column.key} scope="col" className={`p-0 font-bold ${STICKY_LEAD}`}>
                  <span className="flex h-7 items-center px-1.5">
                    <span className={MUTE}>{column.label}</span>
                  </span>
                </th>
              ) : (
                <SortHead
                  key={column.key}
                  // Every column is drawn at every width now that nothing stands
                  // down, so there is no breakpoint class to hand it. `SortHead`
                  // requires the prop because its other two callers — the league
                  // table and the Premiership one — still hide columns on a
                  // phone; making it optional is a change to a shared component
                  // for one caller's convenience, which §1 declines.
                  width=""
                  title={column.title}
                  href={sortHref(query, column.key)}
                  label={column.label}
                  align={column.kind === "text" ? "left" : "right"}
                  sorted={
                    current.key === column.key
                      ? current.descending
                        ? "descending"
                        : "ascending"
                      : undefined
                  }
                />
              ),
            )}
          </HeadRow>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.entry.player.fantraxId} className={`${ROW_RULE} hover:bg-raised`}>
              {columns.map((column) => (
                <Cell
                  key={column.key}
                  column={column}
                  row={row}
                  query={query}
                  stats={raw.get(row.entry.player.fantraxId)}
                  teamNames={teamNames}
                  rated={rated}
                  cut={cuts.get(column.key) ?? null}
                />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
