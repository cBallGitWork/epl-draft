import { type SortKey, defaultDescending } from "@epl/core";
import { LEAGUE } from "./routes";

// Where a sortable column head links to: a link, so the server orders and a sort survives a share.

/** The same column flips direction, a new one opens at its own; Fantrax's order is the bare route. */
export function sortHref(key: SortKey, current: SortKey, descending: boolean): string {
  const next = key === current ? !descending : defaultDescending(key);
  if (key === "rank" && next === false) return LEAGUE;
  // A bare query reads as the column's own way, so a flip against it has to say so.
  const dir = next ? "&dir=desc" : defaultDescending(key) ? "&dir=asc" : "";
  return `${LEAGUE}?sort=${key}${dir}`;
}
