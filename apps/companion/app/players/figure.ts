import { MINUTES } from "@epl/core";
import type { PoolRow } from "./pool";
import type { PoolColumn, RawStats } from "./columns";
import { per90 } from "./standout";

// What a column prints for one man under the board's setting: the cell, the sort and the standouts all read this.

/** What a column prints for one man; a column that is not a count comes back untouched whatever the toggle says. */
export function figureOf(
  column: PoolColumn,
  row: PoolRow,
  stats: RawStats,
  rated: boolean,
): number | string | null {
  const value = column.value(row, stats);
  if (!rated || column.rate !== true || typeof value !== "number") return value;
  return per90(value, stats?.[MINUTES.short] ?? null);
}
