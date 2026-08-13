import type { PoolRow } from "./pool";

// What the URL says the table should show. State lives in the address bar rather
// than in browser state: a server component stays a server component, the whole
// pool never crosses to the phone as data, and a manager can send someone a link
// to exactly what he is looking at.

export interface PlayersQuery {
  q?: string;
  pos?: string;
  status?: string;
  sort?: string;
  dir?: string;
  all?: string;
}

/** How many rows a page carries before it says so and offers the rest.
 *
 *  The pool is seven hundred names and all of them is a fifth of a megabyte
 *  gzipped — a real cost on a phone at a ground with no signal, spent on rows
 *  nobody scrolls to. A manager looking for a player searches or filters; a
 *  manager reading the table wants the top of it. Both are served by the first
 *  hundred, and the rest is one tap away and said out loud. */
export const PAGE_ROWS = 100;

/** The sortable columns, in the order they appear. Keys are short because they
 *  end up in the address bar. */
export const COLUMNS = [
  { key: "rank", label: "Rk", title: "Fantrax's own ranking", ascending: true },
  { key: "name", label: "Player", title: "Name", ascending: true },
  { key: "fpts", label: "FPts", title: "Fantasy points", ascending: false },
  { key: "fpg", label: "FP/G", title: "Fantasy points per game", ascending: false },
] as const;

export type ColumnKey = (typeof COLUMNS)[number]["key"];

const VALUE: Record<ColumnKey, (row: PoolRow) => number | string | null> = {
  rank: (row) => row.stats?.rank ?? null,
  name: (row) => row.entry.player.displayName,
  fpts: (row) => row.stats?.points ?? null,
  fpg: (row) => row.stats?.perGame ?? null,
};

function column(key: string | undefined) {
  return COLUMNS.find((entry) => entry.key === key);
}

/** Which column the table is ordered by and which way, resolved once.
 *
 *  Three things need this answer — the ordering, the arrow drawn on the header,
 *  and the link that reverses it — and they must never disagree. They did: the
 *  default view sorted by rank ascending while drawing a descending arrow. */
export function activeSort(query: PlayersQuery): { key: ColumnKey; descending: boolean } {
  const chosen = column(query.sort) ?? COLUMNS[0];
  const fallback = chosen.ascending ? "asc" : "desc";
  return { key: chosen.key, descending: (query.dir ?? fallback) === "desc" };
}

/** The rows the URL asks for, filtered then ordered.
 *
 *  Rows Fantrax has no number for sort last whichever way the column runs. They
 *  are not bottom of the table — they are the academy names it has never scored
 *  — and floating them to the top of an ascending sort would read as nought. */
export function shownRows(rows: readonly PoolRow[], query: PlayersQuery): PoolRow[] {
  const needle = (query.q ?? "").trim().toLowerCase();
  const filtered = rows.filter(
    (row) =>
      (!query.status || row.entry.status === query.status) &&
      (!query.pos || row.entry.eligiblePositions.includes(query.pos)) &&
      (!needle || row.entry.player.displayName.toLowerCase().includes(needle)),
  );

  const { key, descending } = activeSort(query);
  const read = VALUE[key];

  return filtered.sort((left, right) => {
    const a = read(left);
    const b = read(right);
    if (a === null) return b === null ? 0 : 1;
    if (b === null) return -1;
    const order = typeof a === "string" && typeof b === "string" ? a.localeCompare(b) : Number(a) - Number(b);
    return descending ? -order : order;
  });
}

/** The same list, showing every row. */
export function showAllHref(query: PlayersQuery): string {
  const next = new URLSearchParams();
  for (const [name, value] of Object.entries(query)) if (value) next.set(name, value);
  next.set("all", "1");
  return `/players?${next}`;
}

/** The link that sorts by a column, or reverses it if it is already the one.
 *
 *  Every column starts in the direction that answers the question being asked of
 *  it: points highest first, names from A. */
export function sortHref(query: PlayersQuery, key: ColumnKey): string {
  const next = new URLSearchParams();
  for (const [name, value] of Object.entries(query)) {
    if (value && name !== "sort" && name !== "dir") next.set(name, value);
  }
  const first = column(key)?.ascending ?? true;
  const current = activeSort(query);
  // Tapping the column you are already sorted by turns it round; tapping any
  // other starts it in the direction that answers the question asked of it —
  // points highest first, names from A.
  const descending = current.key === key ? !current.descending : !first;
  next.set("sort", key);
  next.set("dir", descending ? "desc" : "asc");
  return `/players?${next}`;
}

/** Tapping the filter you are already on clears it, so every chip is its own way
 *  back and the page needs no "all" button to undo itself. */
export function filterHref(query: PlayersQuery, key: string, value: string): string {
  const next = new URLSearchParams();
  for (const [name, held] of Object.entries(query)) if (held) next.set(name, held);
  if (next.get(key) === value) next.delete(key);
  else next.set(key, value);
  const search = next.toString();
  return search ? `/players?${search}` : "/players";
}
