import type { PoolRow } from "./pool";
import { type PoolColumn } from "./columns";
import { MUTE, SortHead } from "../components/league/TableHeads";
import PositionTile, { TILE_WIDTH } from "../components/league/PositionTile";
import type { StandoutCut } from "../components/league/standout";
import { activeSort, sortHref } from "./query";
import type { PlayersQuery } from "./query";
import { BOARD, HEAD_CELL, ROW_RULE, SCROLL } from "@/app/desk";
import Cell, { Lead } from "./Cell";

// The pool as one sortable board: every column, phone-first, each sort a link so the server orders and the URL keeps it.
// The lead is pinned while the figures scroll (DESIGN §9); the desk adds CM's position tile down the left.

export default function PlayerTable({
  rows,
  columns,
  query,
  teamNames,
  reader,
  raw,
  rated,
  cuts,
}: {
  rows: readonly PoolRow[];
  /** The columns this plate shows, worked out by the page so the cuts are taken over exactly these. */
  columns: readonly PoolColumn[];
  query: PlayersQuery;
  teamNames: Map<string, string>;
  /** The reader's own team, so his players read "Yours"; null for a reader with no team. */
  reader: string | null;
  /** The grouped payload's raw counts, by Fantrax id. */
  raw: Map<string, Record<string, number | null>>;
  /** Whether the counts are drawn per ninety minutes. */
  rated: boolean;
  /** Each lit column's cuts, by key. */
  cuts: Map<string, StandoutCut>;
}) {
  const current = activeSort(query);
  const figures = columns.filter((column) => column.key !== "name");
  return (
    // Opaque, so the pinned lead hides the figures under it; a fade says there is more to the right.
    <div className="relative">
      <span aria-hidden className="pointer-events-none absolute inset-y-0 right-0 z-20 w-8 bg-gradient-to-l from-surface lg:hidden" />
      <div className={`cm-scroll bg-surface ${SCROLL}`}>
        <table className={BOARD}>
          <thead>
            <tr className="text-2xs">
              {/* CM heads its figures only: the tile and the name carry no plate. */}
              <th scope="col" className={`${HEAD_CELL} ${PIN_TILE} ${TILE_WIDTH} bg-surface`}>
                <span className={MUTE}>Fantrax position</span>
              </th>
              <th scope="col" className={`${HEAD_CELL} ${PIN_NAME}`}>
                <span className={MUTE}>Player</span>
              </th>
              {figures.map((column) => (
                <SortHead
                  key={column.key}
                  width=""
                  compact
                  title={column.title}
                  href={sortHref(query, column.key)}
                  label={column.label}
                  sorted={current.key === column.key ? (current.descending ? "descending" : "ascending") : undefined}
                />
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.entry.player.fantraxId} className={`${ROW_RULE} hover:bg-raised`}>
                <PositionTile positions={row.entry.eligiblePositions} cell className={PIN_TILE} />
                <Lead row={row} query={query} teamNames={teamNames} reader={reader} className={PIN_NAME} />
                {figures.map((column) => (
                  <Cell
                    key={column.key}
                    column={column}
                    row={row}
                    stats={raw.get(row.entry.player.fantraxId)}
                    rated={rated}
                    cut={cuts.get(column.key)}
                  />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** The tile is the desk's; the phone carries position on the name's second line. */
const PIN_TILE = "hidden lg:table-cell sticky left-0 z-10";

/** The lead stays put while the figures scroll under it, starting where the desk's tile ends. */
const PIN_NAME = "sticky left-0 z-10 border-r border-line bg-surface p-0 lg:left-14";
