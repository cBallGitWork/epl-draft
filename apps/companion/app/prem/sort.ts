import { type TableSortKey, defaultDescendingTable } from "@epl/core";
import { TABLE } from "./PremNav";

// Where a sortable column head links to.
//
// The ordering is `packages/core/src/football/tableOrder.ts` — pure, tested, and
// the layer that owns what the table means. This holds only the URL, which is
// the app's own concern: sorting is a link rather than a click handler, so the
// server does the ordering, the phone gets HTML, and a sorted table survives
// being shared.

/** The same column flips direction; a new column opens at its own natural one.
 *
 *  `place` ascending is the competition's own order and the page's default, so
 *  it is spelled as no query at all rather than `?sort=place` — one URL for the
 *  default rather than two. `league/sort.ts` records the same decision. */
export function tableHref(
  key: TableSortKey,
  current: TableSortKey,
  descending: boolean,
): string {
  const next = key === current ? !descending : defaultDescendingTable(key);
  if (key === "place" && next === false) return TABLE;
  return `${TABLE}?sort=${key}${next ? "&dir=desc" : ""}`;
}
