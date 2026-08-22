import type { PoolRow } from "./pool";

// What the URL says the table should show. State lives in the address bar rather
// than in browser state: a server component stays a server component, the whole
// pool never crosses to the phone as data, and a manager can send someone a link
// to exactly what he is looking at.

/** What Next hands a page for `?a=b`, verbatim.
 *
 *  A repeated parameter arrives as an ARRAY — `?q=a&q=b` gives `["a","b"]` — and
 *  this used to be typed as `string` throughout, which is a lie the compiler
 *  then enforced downstream: `.trim()` on an array threw and the page answered
 *  500. Nobody types that by hand, but a crawler following two links, a
 *  double-submitted form or a shared URL somebody edited all produce it.
 *
 *  Mirrored as it really is and narrowed in one place, on the same rule `raw.ts`
 *  follows for a provider: types describe reality, and the narrowing happens
 *  where the two meet. */
export interface PlayersSearchParams {
  q?: string | string[];
  pos?: string | string[];
  status?: string | string[];
  sort?: string | string[];
  dir?: string | string[];
  all?: string | string[];
}

/** The same query, narrowed. */
export interface PlayersQuery {
  q?: string;
  pos?: string;
  status?: string;
  sort?: string;
  dir?: string;
  all?: string;
}

/** The last value wins, which is what a browser does with a repeated field and
 *  what a reader editing a URL by hand means. */
export function playersQuery(raw: PlayersSearchParams): PlayersQuery {
  const one = (value: string | string[] | undefined): string | undefined =>
    Array.isArray(value) ? value[value.length - 1] : value;
  return {
    q: one(raw.q),
    pos: one(raw.pos),
    status: one(raw.status),
    sort: one(raw.sort),
    dir: one(raw.dir),
    all: one(raw.all),
  };
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
  { key: "rank", label: "Rk", title: "Fantrax's own ranking across the whole pool", ascending: true },
  { key: "name", label: "Player", title: "Name", ascending: true },
  { key: "opp", label: "Opp", title: "His fixture, in Fantrax's words", ascending: true },
  { key: "fpts", label: "FPts", title: "Fantasy points, under this league's scoring", ascending: false },
  { key: "fpg", label: "FP/G", title: "Fantasy points per game", ascending: false },
  { key: "ros", label: "Ros", title: "Share of all Fantrax leagues rostering him", ascending: false },
  { key: "trend", label: "+/-", title: "How that share moved since last week", ascending: false },
] as const;

export type ColumnKey = (typeof COLUMNS)[number]["key"];

const VALUE: Record<ColumnKey, (row: PoolRow) => number | string | null> = {
  rank: (row) => row.stats?.rank ?? null,
  name: (row) => row.entry.player.displayName,
  opp: (row) => row.stats?.opponent ?? null,
  fpts: (row) => row.stats?.points ?? null,
  fpg: (row) => row.stats?.perGame ?? null,
  ros: (row) => row.stats?.rostered ?? null,
  trend: (row) => row.stats?.trend ?? null,
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

/** This page again with part of the query changed. An undefined value drops the
 *  key, which is what makes every control below able to undo itself.
 *
 *  Every link on the table goes through here so that none of them can lose the
 *  others' state: a sort that forgot the filter, or a filter that forgot the
 *  search, would be a control that quietly does two things. */
function href(query: PlayersQuery, changes: Partial<PlayersQuery>): string {
  const next = new URLSearchParams();
  for (const [name, value] of Object.entries({ ...query, ...changes })) {
    if (value) next.set(name, value);
  }
  const search = next.toString();
  return search ? `/players?${search}` : "/players";
}

/** The same list, showing every row. */
export function showAllHref(query: PlayersQuery): string {
  return href(query, { all: "1" });
}

/** The link that sorts by a column, or reverses it if it is already the one.
 *
 *  A column not currently sorted starts in the direction that answers the
 *  question being asked of it: points highest first, names from A. */
export function sortHref(query: PlayersQuery, key: ColumnKey): string {
  const current = activeSort(query);
  const descending =
    current.key === key ? !current.descending : !(column(key)?.ascending ?? true);
  return href(query, { sort: key, dir: descending ? "desc" : "asc" });
}

/** Tapping the filter you are already on clears it, so every chip is its own way
 *  back and the page needs no "all" button to undo itself. */
export function filterHref(query: PlayersQuery, key: "status" | "pos", value: string): string {
  return href(query, { [key]: query[key] === value ? undefined : value });
}
