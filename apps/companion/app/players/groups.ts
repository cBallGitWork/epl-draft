import { carries } from "@epl/core";
import { COLUMNS, type PoolColumn } from "./columns";

// Which columns a reader is looking at, and the plates that choose between them (Opta's stat groups, Craig, 10 Sep 2026).

/** Which plate a column appears under: the pool's own groups, since core's `GroupKey` has no fantasy return or market. */
export type PoolGroup = "scoring" | "attacking" | "defensive" | "discipline" | "market" | "attributes";

/** The plates in the order a reader looks for them; `All` first and the default (Craig, 6 Sep 2026). */
export const POOL_GROUPS = [
  { key: "all", label: "All" },
  { key: "scoring", label: "Scoring" },
  { key: "attacking", label: "Attacking" },
  { key: "defensive", label: "Defensive" },
  { key: "discipline", label: "Discipline" },
  { key: "market", label: "Market" },
  { key: "attributes", label: "Attributes" },
] as const;

export type PoolGroupKey = (typeof POOL_GROUPS)[number]["key"];

/** What the URL asked for, narrowed to a plate that exists; anything else is the whole board. */
export function groupFor(key: string | undefined): PoolGroupKey {
  return POOL_GROUPS.find((group) => group.key === key)?.key ?? "all";
}

/** The columns one plate shows: the spine (no `group`) under every plate, the attributes off `All`, and always the
 *  column the board is sorted by, so a plate never hides the order or `aria-sort`. */
export function columnsIn(group: PoolGroupKey, sorted: string, scored: ReadonlySet<string>): readonly PoolColumn[] {
  const shown = COLUMNS.filter(
    (column) =>
      column.group === undefined ||
      column.key === sorted ||
      ((group === "all" ? column.group !== "attributes" : column.group === group) && isScored(column, scored)),
  );
  return group === "attributes" ? leadWith(shown, sorted) : shown;
}

/** Every column a reader can sort by: all but the name, and no count the league does not score. */
export function sortableIn(scored: ReadonlySet<string>): readonly PoolColumn[] {
  return COLUMNS.filter((column) => column.key !== "name" && isScored(column, scored));
}

/** A count the league's read carries, or a column that is not a count. */
function isScored(column: PoolColumn, scored: ReadonlySet<string>): boolean {
  return column.stat === undefined || carries(scored, column.stat);
}

/** The sorted column straight after the spine: twenty-five attributes run far past a phone's seven. */
function leadWith(columns: readonly PoolColumn[], sorted: string): readonly PoolColumn[] {
  const lead = columns.find((column) => column.key === sorted && column.group !== undefined);
  if (lead === undefined) return columns;
  const spine = columns.filter((column) => column.group === undefined);
  return [...spine, lead, ...columns.filter((column) => column.group !== undefined && column !== lead)];
}
