import { type TableSortKey, defaultDescendingTable } from "@epl/core";
import { TABLE } from "./PremNav";

// Where a sortable column head links to; core's `tableOrder.ts` does the ordering.
// A link, not a handler: the server orders the rows and a sorted table survives being shared.

/** The same column flips; a new one opens its natural way; the default order is the bare route. */
export function tableHref(
  key: TableSortKey,
  current: TableSortKey,
  descending: boolean,
): string {
  const next = key === current ? !descending : defaultDescendingTable(key);
  if (key === "place" && next === false) return TABLE;
  // A bare query reads as the column's own way, so a flip against it has to say so.
  const dir = next ? "&dir=desc" : defaultDescendingTable(key) ? "&dir=asc" : "";
  return `${TABLE}?sort=${key}${dir}`;
}
