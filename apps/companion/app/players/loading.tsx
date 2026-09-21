import ScoutShell from "./Shell";
import Skeleton from "../components/shell/Skeleton";
import { COLUMNS } from "./columns";
import { POOL_GROUPS } from "./groups";
import { POOL } from "./routes";
import { PLATE, PRESSABLE } from "./BoardControls";
import { SCROLL } from "@/app/desk";
import { MUTE } from "../components/league/TableHeads";

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
    // **No `sub`.** The count-and-season line came off the real header on
    // 10 Sep 2026, and a skeleton holding a bar open for something that will
    // never arrive is a layout that jumps when the answer lands — which is the
    // one failure a skeleton exists to prevent.
    <ScoutShell>
      {/* **The real control row, at the real sizes.** This drew its own form
          with `BUTTON` on the submit and three bevels of arbitrary width where
          the stat plates go, so the frame that loaded described a different
          screen from the one that arrived: a taller `Find`, three plates instead
          of six, and no `Filter` at all. Every measurement here now comes from
          the same recipes the board uses, so the two cannot drift again.

          The search box is real and works from the first frame — a GET form to
          this same route, so a reader who came to find one player can type his
          name before the other six hundred have arrived. */}
      <div className="flex flex-wrap items-center gap-1.5">
        <form aria-busy action={POOL} className="flex min-w-0 flex-1 gap-1.5 lg:w-44 lg:flex-none xl:w-64">
          <input
            name="q"
            placeholder="Find a player"
            aria-label="Find a player"
            className="cm-panel min-h-11 min-w-0 flex-1 px-3 text-base lg:min-h-9"
          />
          <button type="submit" className={PRESSABLE}>
            Find
          </button>
        </form>

        {/* **Real plates with real labels, and deliberately not links.** The
            group strip reads off `POOL_GROUPS`, so it cannot describe a
            different set from the one that lands — but `loading.tsx` is given no
            search params, so it cannot know what a reader is filtering by, and a
            link built from an empty query would silently drop his filters if he
            tapped one while waiting. An inert plate of the right size holds the
            layout and lies about nothing. */}
        <div className="hidden flex-1 lg:block" aria-hidden>
          <span className="flex flex-1 flex-wrap gap-1.5">
            {POOL_GROUPS.map((entry) => (
              <span key={entry.key} className={`cm-tab cm-tab-quiet ${PLATE}`}>
                {entry.label}
              </span>
            ))}
          </span>
        </div>

        <span className={PRESSABLE} aria-hidden>
          Filter
        </span>
      </div>

      {/* **The table's own shape, which is now a TABLE.** It drew a portrait
          and two stacked bars — the row the directory had before 6 Sep 2026,
          when it was a name over a club and five figures. The directory is
          twenty sortable columns now, so a skeleton of two-line rows is a
          shape the real thing pushes out of the way when it lands.

          The heads are real and read `COLUMNS`, which is DESIGN's rule for a
          skeleton: one source, so the frame that loads cannot describe a
          different table from the one that arrives. The rows are bars, because
          a figure that has not arrived has no width worth guessing. */}
      {/* `bg-surface` to match the board it stands in, which went opaque on
          10 Sep 2026 — a skeleton whose job is to look like the table would
          otherwise be the one thing on the screen still showing the
          photograph through. */}
      <div className={`cm-scroll bg-surface ${SCROLL}`} aria-busy>
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
                  {/* The name column's head prints nothing on the real table
                      (`TableHeads.MUTE`), and a skeleton that prints a word the
                      answer does not is this file's oldest failure wearing a
                      different hat. */}
                  <span className={column.key === "name" ? MUTE : ""}>{column.label}</span>
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
                        {/* A square the size of the crest, not a circle the
                            size of the portrait: the row's lead mark stopped
                            being a photograph of a head on 10 Sep 2026. Two
                            bars, because the name cell carries the name and his
                            club, position and status under it. */}
                        <Skeleton width="1.75rem" height="1.75rem" />
                        <span className="flex flex-col gap-1">
                          <Skeleton width="6rem" height="0.875rem" />
                          <Skeleton width="4rem" height="0.6875rem" />
                        </span>
                      </span>
                    </td>
                  ) : (
                    <td
                      key={column.key}
                      className="px-1.5"
                    >
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
