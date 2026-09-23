import { matchHref } from "./matchRoutes";
import { DEFAULT_SORT, type StatSort } from "./statColumns";

// Where the Stats tab's links go — a link rather than a click handler, so the server sorts (`prem/sort.ts`).

/** Which board the foot row has open: both sides, one club's men, or the Fantasy Report. */
export type StatsView = "match" | "home" | "away" | "fantasy";

export function statsView(value: string | undefined): StatsView {
  return value === "home" || value === "away" || value === "fantasy" ? value : "match";
}

/** The board itself; the match board is the bare tab, so it has one URL. */
export function viewHref(id: number, view: StatsView): string {
  return matchHref(id, "stats", { view: view === "match" ? undefined : view });
}

/** A club board's column head: the same column flips, a new one opens descending; the default is the bare board. */
export function statsHref(
  id: number,
  side: "home" | "away",
  key: StatSort,
  current: StatSort,
  descending: boolean,
): string {
  const next = key === current ? !descending : true;
  const opensDefault = key === DEFAULT_SORT && next;
  return matchHref(id, "stats", {
    view: side,
    sort: opensDefault ? undefined : key,
    dir: next ? undefined : "asc",
  });
}
