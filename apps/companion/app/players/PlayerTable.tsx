import type { PoolRow } from "./pool";
import { type PoolColumn } from "./columns";
import { LeadHeads, sortedAs, SortHead } from "../components/league/TableHeads";
import PositionTile from "../components/league/PositionTile";
import type { StandoutCut } from "../components/league/standout";
import { activeSort, sortHref } from "./query";
import type { PlayersQuery } from "./query";
import { BOARD, ROW_RULE } from "@/app/desk";
import ScrollBoard from "../components/league/ScrollBoard";
import Cell, { Lead } from "./Cell";
import { PIN_NAME, PIN_TILE } from "./BoardRow";

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
    <ScrollBoard>
      <table className={BOARD}>
        <thead>
          <tr className="text-2xs">
            <LeadHeads tile={PIN_TILE} name={PIN_NAME} />
            {figures.map((column) => (
              <SortHead
                key={column.key}
                compact
                title={column.title}
                href={sortHref(query, column.key)}
                label={column.label}
                sorted={sortedAs(current.key === column.key, current.descending)}
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
    </ScrollBoard>
  );
}
