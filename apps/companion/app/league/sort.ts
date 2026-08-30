import { type SortKey, defaultDescending } from "@epl/core";

// Where a sortable column head links to.
//
// The ordering itself is `packages/core/src/league/standingsOrder.ts` — pure,
// tested, and the layer that owns what the table means. This file holds only the
// URL, which is the app's own concern: sorting is a link rather than a click
// handler, so the server does the ordering, the phone gets HTML, and the sort
// survives being shared.

/** The same column flips direction; a new column opens at its own natural one.
 *
 *  `rank` ascending is Fantrax's own order and the page's default, so it is
 *  spelled as no query at all rather than as `?sort=rank` — the table's own
 *  address stays clean and there is one URL for the default rather than two. */
export function sortHref(key: SortKey, current: SortKey, descending: boolean): string {
  const next = key === current ? !descending : defaultDescending(key);
  if (key === "rank" && next === false) return "/league";
  return `/league?sort=${key}${next ? "&dir=desc" : ""}`;
}
