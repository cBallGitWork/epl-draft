import { STAT_COLUMNS, type StatKey } from "./statKeys";
import type { IntelManifest } from "./types";

// `data/intel/stats/26-27.json`: every man who has played, by FPL code, with his season's counts.
// Written by `npm run stats`; only men with minutes are stored, so a miss means no reading at all.

export interface IntelStats {
  manifest: IntelManifest;
  /** Fantrax's own name for the numbers, "2026-27 - YTD". */
  season: string;
  /** The keys `values` follow, in order. */
  columns: string[];
  players: { code: number; values: (number | null)[] }[];
  /** Men on the sheet the bridge could not key, and of those the ones who have played. */
  unbridged: number;
  unbridgedWithMinutes: number;
}

/** One man's counts by key; a key the file did not carry reads as absent. */
export type StatsRow = Readonly<Partial<Record<StatKey, number | null>>>;

const KIND = new Map<string, string>(STAT_COLUMNS.map((column) => [column.key, column.kind]));

/** Each man's counts by FPL code; empty when there is no file. Unknown columns are dropped. */
export function statIntel(file: IntelStats | null): Map<number, StatsRow> {
  const rows = new Map<number, StatsRow>();
  if (file === null) return rows;
  const known = file.columns.flatMap((key, at) => (KIND.has(key) ? [[key, at] as const] : []));
  for (const player of file.players ?? []) {
    if (!Number.isInteger(player?.code)) continue;
    rows.set(player.code, Object.fromEntries(known.map(([key, at]) => [key, player.values[at] ?? null])));
  }
  return rows;
}

/** His count, or null when we hold none. */
export function stat(row: StatsRow | undefined, key: StatKey): number | null {
  return row?.[key] ?? null;
}

/** The keys one list of columns has that the other has not: a changed scoring in the stats league. */
export function columnDrift(
  held: readonly string[],
  fresh: readonly string[],
): { added: string[]; removed: string[] } {
  return {
    added: fresh.filter((key) => !held.includes(key)),
    removed: held.filter((key) => !fresh.includes(key)),
  };
}
