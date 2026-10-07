import ScoutShell, { POOL_ROWS } from "./Shell";
import Skeleton from "../components/shell/Skeleton";
import { COLUMNS } from "./columns";
import { POOL_GROUPS } from "./groups";
import { POOL } from "./routes";
import { PLATE, PRESSABLE } from "./BoardControls";
import { SCROLL } from "@/app/desk";
import { MUTE } from "../components/league/TableHeads";

// The pool, waiting on Fantrax's stats: the real shell and the real control row, so nothing jumps when it lands.

export default function Loading() {
  return (
    <ScoutShell rows={POOL_ROWS}>
      {/* The real control row at the real sizes; the search box works from the first frame. */}
      <div className="flex flex-wrap items-center gap-1.5">
        <form aria-busy action={POOL} className="flex min-w-0 grow basis-26 lg:w-36 lg:flex-none">
          <input
            name="q"
            placeholder="Find a player"
            aria-label="Find a player"
            className="cm-panel min-h-11 min-w-0 flex-1 px-2 text-base lg:min-h-9 lg:px-3"
          />
        </form>

        {/* Inert plates, not links: with no search params a link here would drop the reader's filters. */}
        <div className="hidden flex-1 lg:block" aria-hidden>
          <span className="flex flex-1 flex-wrap gap-1.5">
            {POOL_GROUPS.map((entry) => (
              <span key={entry.key} className={`cm-tab cm-tab-quiet ${PLATE}`}>
                {entry.label}
              </span>
            ))}
          </span>
        </div>

        <span className={`ml-auto ${PRESSABLE}`} aria-hidden>
          Filter
        </span>
      </div>

      {/* The table's shape, its heads read off `COLUMNS` so the frame cannot describe a different table. */}
      <div className={`cm-scroll bg-surface ${SCROLL}`} aria-busy>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-line text-2xs uppercase text-faint">
              {COLUMNS.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={`whitespace-nowrap px-1.5 py-1.5 font-bold ${
                    column.kind === "text" ? "text-left" : "text-center"
                  }`}
                >
                  {/* The name's head is muted on the real table too. */}
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
                        {/* The crest, then the name over its second line. */}
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
