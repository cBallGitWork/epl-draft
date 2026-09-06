import ScoutShell from "./Shell";
import Skeleton from "../components/shell/Skeleton";
import { BUTTON } from "../components/shell/ButtonLink";
import { COLUMNS } from "./columns";
import { SCROLL } from "@/app/desk";

// The pool, waiting on Fantrax's 533 KB of stats.
//
// `ScoutShell` is the real one, so the bar, the caption and the panel are on
// screen and working before a row exists — the same rule `league/loading` sets,
// and the reason this route stopped drawing a header of its own.
//
// The search box is real and works from the first frame: it is a GET form to
// this same route, so a reader who came here to find one player can type his
// name before the other six hundred have arrived. The status and position chips
// are the league's own vocabulary, read off the pool, so those are blocks.

export default function Loading() {
  return (
    <ScoutShell sub={<Skeleton width="10rem" height="0.75rem" />}>
      <form aria-busy action="/players" className="flex gap-1.5">
        <input
          name="q"
          placeholder="Find a player"
          aria-label="Find a player"
          className="cm-panel min-h-11 min-w-0 flex-1 px-3 text-base"
        />
        <button
          type="submit"
          className={BUTTON}
        >
          Find
        </button>
      </form>

      {/* Real plates with a bar in them, not blocks the shape of one. `cm-tab`
          owns the height, so these cannot drift from the chips that land in
          them the way a copied `2.75rem` did — and an empty bevelled tab is
          Championship Manager's own idiom for one with nothing in it yet
          (`cm9900/12.jpg`, the greyed "Unused" pair). */}
      <div className="flex flex-wrap gap-1.5">
        {["7rem", "6rem", "4rem"].map((width) => (
          <span key={width} className="cm-tab flex items-center px-3" style={{ width }}>
            <Skeleton width="100%" height="0.875rem" />
          </span>
        ))}
      </div>

      {/* **The table's own shape, which is now a TABLE.** It drew a portrait
          and two stacked bars — the row the directory had before 6 Sep 2026,
          when it was a name over a club and five figures. The directory is
          twenty-four sortable columns now, so a skeleton of two-line rows is a
          shape the real thing pushes out of the way when it lands.

          The heads are real and read `COLUMNS`, which is DESIGN's rule for a
          skeleton: one source, so the frame that loads cannot describe a
          different table from the one that arrives. The rows are bars, because
          a figure that has not arrived has no width worth guessing. */}
      <div className={`cm-scroll ${SCROLL}`} aria-busy>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-line text-2xs uppercase text-faint">
              {COLUMNS.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={`whitespace-nowrap px-1.5 py-1.5 font-bold ${
                    column.kind === "text" ? "text-left" : "text-right"
                  }`}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 8 }, (_, at) => (
              <tr key={at} className="border-b border-line/60">
                {COLUMNS.map((column) =>
                  column.key === "name" ? (
                    <td key={column.key} className="py-1 lg:py-0">
                      <span className="cm-row flex min-h-11 items-center gap-2.5 px-1">
                        <Skeleton
                          width="var(--row-portrait)"
                          height="var(--row-portrait)"
                          circle
                        />
                        <Skeleton width="6rem" height="0.875rem" />
                      </span>
                    </td>
                  ) : (
                    <td key={column.key} className="px-1.5">
                      <Skeleton width="1.5rem" height="0.6875rem" />
                    </td>
                  ),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ScoutShell>
  );
}
