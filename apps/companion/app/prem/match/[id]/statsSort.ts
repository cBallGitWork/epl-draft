import { MATCH } from "../../routes";
import type { StatSort } from "./statColumns";

// Where the Stats tab's links go — a link rather than a click handler, so the server sorts (`prem/sort.ts`).

/** Which board the foot row has open: both sides, one club's men, or the Fantasy Report. */
export type StatsView = "match" | "home" | "away" | "fantasy";

export function statsView(value: string | undefined): StatsView {
  return value === "home" || value === "away" || value === "fantasy" ? value : "match";
}

/** The board itself; the match board is the bare tab, so it has one URL. */
export function viewHref(id: number, view: StatsView): string {
  const stats = `${MATCH}/${id}/stats`;
  return view === "match" ? stats : `${stats}?view=${view}`;
}

/** A club board opens ranked by fantasy points (Craig, 23 Sep 2026). */
export const DEFAULT_SORT: StatSort = "Pts";

/** A club board's column head: the same column flips, a new one opens descending; the default is the bare board. */
export function statsHref(
  id: number,
  side: "home" | "away",
  key: StatSort,
  current: StatSort,
  descending: boolean,
): string {
  const next = key === current ? !descending : true;
  if (key === DEFAULT_SORT && next) return viewHref(id, side);
  return `${viewHref(id, side)}&sort=${encodeURIComponent(key)}${next ? "" : "&dir=asc"}`;
}
