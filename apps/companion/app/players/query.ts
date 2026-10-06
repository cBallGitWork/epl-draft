import type { PoolRow } from "./pool";
import { POOL, lastValue } from "./routes";
import { COLUMNS, DEFAULT_SORT, columnFor } from "./columns";
import { figureOf } from "./figure";
import { byFigure } from "../components/league/order";

// What the URL says a Data board shows. State lives in the address bar, so the board stays a server component, the
// pool never crosses to the phone as data, and a link shares exactly what is on screen.

/** What Next hands a page for `?a=b`, verbatim: a repeated parameter arrives as an array. */
export interface PlayersSearchParams {
  compare?: string | string[];
  /** Which plate of columns the board is on. */
  group?: string | string[];
  q?: string | string[];
  pos?: string | string[];
  status?: string | string[];
  /** Whether the figures are per 90 minutes. */
  per?: string | string[];
  club?: string | string[];
  /** Whether the filter drawer is open: URL state, so the board needs no script for it. */
  panel?: string | string[];
  sort?: string | string[];
  dir?: string | string[];
  all?: string | string[];
  /** Projections' category: which of a week's points the columns show. */
  cat?: string | string[];
}

/** The same query, narrowed. */
export interface PlayersQuery {
  /** The first man of a comparison, while the board is the picker for the second. */
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
  cat?: string;
}

/** The last value wins, as a browser does with a repeated field. */
export function playersQuery(raw: PlayersSearchParams): PlayersQuery {
  return {
    compare: lastValue(raw.compare),
    q: lastValue(raw.q),
    pos: lastValue(raw.pos),
    status: lastValue(raw.status),
    sort: lastValue(raw.sort),
    dir: lastValue(raw.dir),
    all: lastValue(raw.all),
    group: lastValue(raw.group),
    per: lastValue(raw.per),
    club: lastValue(raw.club),
    panel: lastValue(raw.panel),
    cat: lastValue(raw.cat),
  };
}

/** Whether the counts are drawn per ninety minutes: `?per=90`, and anything else is off. */
export function isPer90(query: PlayersQuery): boolean {
  return query.per === "90";
}

/** Rows a page carries before it offers the rest: the whole pool is a fifth of a megabyte on a phone. */
export const PAGE_ROWS = 100;

/** Which column the table is ordered by and which way, resolved once for the order, the arrow and the reverse link. */
export function activeSort(query: PlayersQuery): { key: string; descending: boolean } {
  const chosen = columnFor(query.sort) ?? columnFor(DEFAULT_SORT) ?? COLUMNS[0];
  const fallback = chosen.ascending ? "asc" : "desc";
  return { key: chosen.key, descending: (query.dir ?? fallback) === "desc" };
}

/** The rows the URL asks for, filtered then ordered by the figure on screen; a man with no figure sorts last either
 *  way. Filters are unions within themselves (defenders or midfielders) and an intersection between. */
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
      (club === "" || row.entry.player.clubCode === club) &&
      (status.length === 0 || status.includes(row.entry.status)) &&
      (positions.length === 0 ||
        positions.some((position) => row.entry.eligiblePositions.includes(position))) &&
      (!needle || row.entry.player.displayName.toLowerCase().includes(needle)),
  );

  const { key, descending } = activeSort(query);
  const read = columnFor(key) ?? columnFor(DEFAULT_SORT) ?? COLUMNS[0];

  return filtered.sort((left, right) => {
    const a = figureOf(read, left, raw.get(left.entry.player.fantraxId), rated);
    const b = figureOf(read, right, raw.get(right.entry.player.fantraxId), rated);
    return byFigure(a, b, descending);
  });
}

/** A Data board again with part of the query changed; an undefined value drops the key, so every control can undo
 *  itself. Every link goes through here so none loses the others' state. */
export function boardHref(query: PlayersQuery, changes: Partial<PlayersQuery>, route: string = POOL): string {
  const next = new URLSearchParams();
  for (const [name, value] of Object.entries({ ...query, ...changes })) {
    if (value) next.set(name, value);
  }
  const search = next.toString();
  return search ? `${route}?${search}` : route;
}

/** The link that sorts by a column, or reverses it if it is already the one. */
export function sortHref(query: PlayersQuery, key: string): string {
  const current = activeSort(query);
  const descending =
    current.key === key ? !current.descending : !(columnFor(key)?.ascending ?? true);
  return boardHref(query, { sort: key, dir: descending ? "desc" : "asc" });
}

/** The values chosen for one filter, a comma list in one parameter (`?pos=D,M`), blanks dropped. */
export function chosen(value: string | undefined): string[] {
  return (value ?? "").split(",").filter(Boolean);
}

/** Whether a chip is on. */
export function isChosen(query: PlayersQuery, key: "status" | "pos", value: string): boolean {
  return chosen(query[key]).includes(value);
}

/** Add a filter, or take it away if it is already on; the last one off drops the parameter. */
export function filterHref(query: PlayersQuery, key: "status" | "pos", value: string, route?: string): string {
  const on = chosen(query[key]);
  const next = on.includes(value) ? on.filter((entry) => entry !== value) : [...on, value];
  return boardHref(query, { [key]: next.length > 0 ? next.join(",") : undefined }, route);
}
