import type { PoolRow } from "./pool";
import { COLUMNS, DEFAULT_SORT, columnFor } from "./columns";
import { figureOf } from "./figure";
import { groupFor, type PoolGroupKey } from "./groups";

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
  compare?: string | string[];
  /** Which plate of columns the board is on. **It used to mean something else
   *  entirely** — this page was a CM leaderboard of one measure until 6 Sep
   *  2026, and `group`/`cat` chose WHICH measure it ranked. That board is gone
   *  and `cat` went with it (it had no reader left; found 10 Sep). The name is
   *  reused rather than retired because a group of columns is what a reader
   *  means by it, and an old shared link now lands on the whole board rather
   *  than on an error. */
  group?: string | string[];
  q?: string | string[];
  pos?: string | string[];
  status?: string | string[];
  /** How the board is expressed rather than what it lists — which columns are
   *  on it, whether they are rated, and how much football a man must have
   *  played to appear. */
  per?: string | string[];
  club?: string | string[];
  /** Whether the filter drawer is open. URL state and not React state, so the
   *  one control that reveals all the others is not the only one on this page
   *  that needs a script — see `BoardBar`. */
  panel?: string | string[];
  sort?: string | string[];
  dir?: string | string[];
  all?: string | string[];
}

/** The same query, narrowed. */
export interface PlayersQuery {
  /** The first man of a comparison, while one is being chosen. The board becomes
   *  a picker: every row leads to `/players/analysis` with him on one side rather
   *  than to the player's own screen. URL state, so the half-made comparison
   *  survives a filter, a sort and being shared. */
  compare?: string;
  q?: string;
  pos?: string;
  status?: string;
  sort?: string;
  dir?: string;
  all?: string;
  group?: string;
  per?: string;
  club?: string;
  panel?: string;
}

/** The last value wins, which is what a browser does with a repeated field and
 *  what a reader editing a URL by hand means. */
export function playersQuery(raw: PlayersSearchParams): PlayersQuery {
  const one = (value: string | string[] | undefined): string | undefined =>
    Array.isArray(value) ? value[value.length - 1] : value;
  return {
    compare: one(raw.compare),
    q: one(raw.q),
    pos: one(raw.pos),
    status: one(raw.status),
    sort: one(raw.sort),
    dir: one(raw.dir),
    all: one(raw.all),
    group: one(raw.group),
    per: one(raw.per),
    club: one(raw.club),
    panel: one(raw.panel),
  };
}

/** Which plate the board is on. */
export function activeGroup(query: PlayersQuery): PoolGroupKey {
  return groupFor(query.group);
}

/** Whether the counts are drawn per ninety minutes.
 *
 *  One value and not a number, because there is one rate anybody asks a football
 *  table for. `?per=90` reads as what it is in the address bar, and anything
 *  else is off — a toggle that a stray query string could put into a third state
 *  is a toggle with a bug in it. */
export function isPer90(query: PlayersQuery): boolean {
  return query.per === "90";
}

/** Where the pool lives.
 *
 *  It was `PLAYERS` in `league/SectionNav` while the pool was a league view, and
 *  it came here on 6 Sep 2026 with the section (`players/Shell`). This file
 *  already built every other `/players` href, so the literal was here twice
 *  over anyway — the constant is the third spelling collapsing into the two. */
export const POOL = "/players";

/** And where the comparison lives. **Three sites**, counted 7 Sep 2026 —
 *  `PoolNav`'s strip entry, `PlayerTable`'s row link while the board is a
 *  picker, and the swap link on the comparison itself — which is `POOL`'s own
 *  argument arriving a second time: a route spelled in three files is a route
 *  that can be renamed in two of them.
 *
 *  The `?a=&b=` builder around it is deliberately NOT extracted: two sites, and
 *  they differ in what they are doing rather than in how — one completes a pair
 *  being chosen and the other reverses a finished one. §1 leaves two alone. */
export const ANALYSIS = "/players/analysis";

/** How many rows a page carries before it says so and offers the rest.
 *
 *  The pool is seven hundred names and all of them is a fifth of a megabyte
 *  gzipped — a real cost on a phone at a ground with no signal, spent on rows
 *  nobody scrolls to. A manager looking for a player searches or filters; a
 *  manager reading the table wants the top of it. Both are served by the first
 *  hundred, and the rest is one tap away and said out loud. */
export const PAGE_ROWS = 100;

/** Which column the table is ordered by and which way, resolved once.
 *
 *  Three things need this answer — the ordering, the arrow drawn on the header,
 *  and the link that reverses it — and they must never disagree. They did: the
 *  default view sorted by rank ascending while drawing a descending arrow.
 *
 *  The column table itself is `columns.ts` now, because it grew from seven to
 *  twenty-four — twenty today — and carries a reader per column. */
export function activeSort(query: PlayersQuery): { key: string; descending: boolean } {
  const chosen = columnFor(query.sort) ?? columnFor(DEFAULT_SORT) ?? COLUMNS[0];
  const fallback = chosen.ascending ? "asc" : "desc";
  return { key: chosen.key, descending: (query.dir ?? fallback) === "desc" };
}

/** The rows the URL asks for, filtered then ordered.
 *
 *  Rows Fantrax has no number for sort last whichever way the column runs. They
 *  are not bottom of the table — they are the academy names it has never scored
 *  — and floating them to the top of an ascending sort would read as nought.
 *
 *  **The raw stats come in as an argument**, because half the sortable columns
 *  now live in the grouped payload rather than on the row: a table that could
 *  show `Sv` and not order by it would be a column a reader taps and nothing
 *  happens. */
export function shownRows(
  rows: readonly PoolRow[],
  query: PlayersQuery,
  raw: Map<string, Record<string, number | null>>,
): PoolRow[] {
  const needle = (query.q ?? "").trim().toLowerCase();
  const status = chosen(query.status);
  const positions = chosen(query.pos);
  const club = (query.club ?? "").trim();
  const rated = isPer90(query);
  const filtered = rows.filter(
    (row) =>
      // **One club or all of them**, unlike the two filters below it. Those are
      // unions within themselves because a reader wants defenders OR
      // midfielders; nobody asks for "Arsenal or Chelsea", and twenty chips is
      // the wall `ClubPicker` exists to avoid. A single value also means the
      // control can be a `<select>`, which is the right object for a set of
      // twenty.
      (club === "" || row.entry.player.clubCode === club) &&
      // **Any of the chosen, not all of them** — the two filters are unions
      // within themselves and an intersection between: "a defender or a
      // midfielder, who is also a free agent". Requiring every chosen position
      // at once would be a filter that empties itself on the second tap, since
      // almost nobody is eligible at three.
      (status.length === 0 || status.includes(row.entry.status)) &&
      (positions.length === 0 ||
        positions.some((position) => row.entry.eligiblePositions.includes(position))) &&
      (!needle || row.entry.player.displayName.toLowerCase().includes(needle)),
  );

  const { key, descending } = activeSort(query);
  const read = columnFor(key) ?? columnFor(DEFAULT_SORT) ?? COLUMNS[0];

  return filtered.sort((left, right) => {
    // **`figureOf` and not `read.value`**, so the order is the order of what is
    // ON SCREEN. Under the per-90 toggle a column prints a rate and used to sort
    // by the raw count behind it — a table whose arrow points at a column it is
    // not actually ordered by, which is the one failure `activeSort`'s docblock
    // already records this page making once.
    const a = figureOf(read, left, raw.get(left.entry.player.fantraxId), rated);
    const b = figureOf(read, right, raw.get(right.entry.player.fantraxId), rated);
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
  return search ? `${POOL}?${search}` : POOL;
}

/** The same board with one setting changed — the plate, the rate, the minutes
 *  floor.
 *
 *  **One exported builder rather than three**, because the three would differ
 *  only in which key they set and each would need its own "and undefined turns
 *  it off" sentence. `filterHref` below stays its own function for the opposite
 *  reason: it does not set a value, it toggles one INSIDE a comma list, which is
 *  a different operation that happens to produce a link.
 *
 *  Passing `undefined` drops the key, which is what lets every control here undo
 *  itself: `{ per: undefined }` is the per-90 toggle turning off and
 *  `{ mins: undefined }` is the minutes floor going back to the whole pool. */
export function boardHref(query: PlayersQuery, changes: Partial<PlayersQuery>): string {
  return href(query, changes);
}

/** The same list, showing every row. */
export function showAllHref(query: PlayersQuery): string {
  return href(query, { all: "1" });
}

/** The link that sorts by a column, or reverses it if it is already the one.
 *
 *  A column not currently sorted starts in the direction that answers the
 *  question being asked of it: points highest first, names from A. */
export function sortHref(query: PlayersQuery, key: string): string {
  const current = activeSort(query);
  const descending =
    current.key === key ? !current.descending : !(columnFor(key)?.ascending ?? true);
  return href(query, { sort: key, dir: descending ? "desc" : "asc" });
}

/** The values chosen for one filter, in the order they were chosen.
 *
 *  A comma list in one parameter rather than a repeated one: `?pos=D,M` is
 *  readable in the address bar, survives being shared, and keeps the GET form's
 *  hidden fields as the plain strings they already were. Blanks are dropped so a
 *  trailing comma somebody typed is not a filter on the empty string. */
export function chosen(value: string | undefined): string[] {
  return (value ?? "").split(",").filter(Boolean);
}

/** Whether a chip is on. */
export function isChosen(query: PlayersQuery, key: "status" | "pos", value: string): boolean {
  return chosen(query[key]).includes(value);
}

/** Add a filter, or take it away if it is already on.
 *
 *  **Several at once** (Craig, 6 Sep 2026: *"think we need the ability to select
 *  multiple filters as well"*). It set one value and cleared it on a second tap,
 *  so choosing defenders and midfielders together was impossible and the chips
 *  behaved like a tab strip — which is what they are drawn as, and was the tell.
 *  Every chip is still its own way back, and turning the last one off drops the
 *  parameter rather than leaving an empty one in the URL. */
export function filterHref(query: PlayersQuery, key: "status" | "pos", value: string): string {
  const on = chosen(query[key]);
  const next = on.includes(value) ? on.filter((entry) => entry !== value) : [...on, value];
  return href(query, { [key]: next.length > 0 ? next.join(",") : undefined });
}
