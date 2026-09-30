import type { StatSeason } from "../stats";
import { numeric, season, type RawPoolStats } from "./stats";

// Every scoring category `getPlayerStats` answers for one position group, which in the stats league
// is every category Fantrax has. Read by `scipId` (`5010#6120#-1`: group, stat, a constant), because
// short names repeat (`CS` twice, `CF` twice) and the id does not. Fixed columns carry no `scipId`.

export interface SheetColumn {
  /** Fantrax's stat id, the `scipId`'s middle part: the same in both groups (`6120` is minutes). */
  stat: string;
  short: string;
  name: string;
}

export interface SheetLine {
  fantraxId: string;
  /** In `columns` order; null where the cell printed nothing. */
  values: (number | null)[];
}

export interface StatSheet {
  season: StatSeason;
  columns: SheetColumn[];
  lines: SheetLine[];
}

export function mapStatSheet(raw: RawPoolStats): StatSheet {
  const columns: SheetColumn[] = [];
  const at: number[] = [];
  (raw.tableHeader?.cells ?? []).forEach((cell, index) => {
    const stat = cell.scipId?.split("#")[1];
    if (!stat) return;
    columns.push({ stat, short: cell.shortName ?? "", name: cell.name ?? "" });
    at.push(index);
  });

  const lines = (raw.statsTable ?? []).flatMap((row): SheetLine[] => {
    const fantraxId = row.scorer?.scorerId;
    if (!fantraxId) return [];
    const cells = row.cells ?? [];
    return [{ fantraxId, values: at.map((index) => numeric(cells[index]?.content)) }];
  });

  return { season: season(raw.displayedSeasonOrProjection), columns, lines };
}
