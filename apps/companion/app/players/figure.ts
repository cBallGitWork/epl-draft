import type { PoolRow } from "./pool";
import type { PoolColumn, RawStats } from "./columns";
import { per90 } from "./standout";

// What a column actually prints for one man, under the board's current setting.
//
// A file of its own because THREE readers need this answer and every one of them
// used to work it out separately: the cell that draws the figure, the comparator
// that orders by it, and the arithmetic that decides whether it is at the top of
// its column. Two of those disagreeing is not a visible bug — it is a table
// sorted by a number nobody can see.
//
// Splitting it out of `columns.ts` also drops that file back under CODE_RULES
// §4's ceiling and takes its one dependency on the standout module with it: a
// column table should describe columns, not know how a rate is computed.

/** Fantrax's own name for the minutes column, which is the denominator under
 *  every rate this board can draw.
 *
 *  **Private again.** It was exported because three files asked for it — this
 *  rate, the minutes filter and the column itself — and the filter was deleted
 *  on 10 Sep 2026, taking the second reader with it. The `Min` column reaches
 *  its figure through the ordinary `count()` helper like every other column, so
 *  the only caller left is the line below. */
const MINUTES_KEY = "Min";

/** What a column prints for one man, under the board's current setting.
 *
 *  A column that is not a count comes back untouched whatever the toggle says,
 *  which is what makes the toggle safe to leave on: `FP/G`, `Ros` and the
 *  fixture mean the same thing per ninety minutes as they do per season, which
 *  is to say they mean nothing per ninety minutes at all. */
export function figureOf(
  column: PoolColumn,
  row: PoolRow,
  stats: RawStats,
  rated: boolean,
): number | string | null {
  const value = column.value(row, stats);
  if (!rated || column.rate !== true || typeof value !== "number") return value;
  return per90(value, stats?.[MINUTES_KEY] ?? null);
}
