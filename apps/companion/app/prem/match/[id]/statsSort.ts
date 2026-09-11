import { MATCH } from "../../routes";
import { DEFAULT_SORT } from "./PlayerStats";
import type { StatSort } from "./PlayerStats";

// Where a sortable column head on the Player Stats board links to.
//
// **The app's own sorting idiom, second use on a match screen.** `prem/sort.ts`
// records the argument in full and it is worth the one line here: sorting is a
// LINK rather than a click handler, so the server does the ordering, a phone
// gets HTML, and a sorted table survives being shared or reloaded.
//
// Its own file rather than a helper inside `PlayerStats`, because the page reads
// the query and the board renders it — two callers, and a function that both
// import from the component would drag the whole board into the page's own
// module graph for a string.

/** The same column flips direction; a new column opens descending.
 *
 *  **Descending is the natural direction for every column here**, unlike the
 *  league table where `place` ascends. These are all "how much did he do",
 *  including goals conceded — a keeper who let in four is the notable one, and a
 *  reader who wants the other end has one tap.
 *
 *  The default is spelled as no query at all rather than `?sort=Pts`, so the
 *  tab has one URL rather than two. `prem/sort.ts` made the same call. */
export function statsHref(
  id: number,
  key: StatSort,
  current: StatSort,
  descending: boolean,
): string {
  const next = key === current ? !descending : true;
  const stats = `${MATCH}/${id}/stats`;
  if (key === DEFAULT_SORT && next) return stats;
  return `${stats}?sort=${encodeURIComponent(key)}${next ? "" : "&dir=asc"}`;
}
