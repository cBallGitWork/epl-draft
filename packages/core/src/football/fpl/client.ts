import { FPL_API_BASE } from "../../config";
import { notJson, statusError } from "../../http/errors";
import { politeFetch } from "../../http/fetch";
import { readJson } from "../../http/json";
import type { RawBootstrap, RawElementSummary, RawFixture, RawLive, RawRegion } from "./raw";

// All FPL network I/O, public and unauthenticated; manners live in the shared `http/fetch.ts`.

/** No freshness here: a Next segment's `revalidate` owns it, and core must not know about Next. */
async function get<T>(path: string): Promise<T> {
  const res = await politeFetch(`${FPL_API_BASE}${path}`);
  // Throw rather than degrade to a default, so the caller can say so on screen.
  if (!res.ok) throw statusError("FPL", path, res.status);
  return (await readJson(res, notJson("FPL", path))) as T;
}

/** Players, clubs and gameweeks; ~1.3 MB. */
export function fetchBootstrap(): Promise<RawBootstrap> {
  return get<RawBootstrap>("/bootstrap-static/");
}

/** The countries an element's `region` points into. Static; the whole list is ~20 KB. */
export function fetchRegions(): Promise<RawRegion[]> {
  return get<RawRegion[]>("/regions/");
}

/** Fixtures for one gameweek, or the whole season when `gameweek` is omitted. */
export function fetchFixtures(gameweek?: number): Promise<RawFixture[]> {
  const q = gameweek == null ? "" : `?event=${gameweek}`;
  return get<RawFixture[]>(`/fixtures/${q}`);
}

/** Live per-player stats for a gameweek. Empty (`{elements: []}`) until the first
 *  match of that gameweek kicks off. */
export function fetchLive(gameweek: number): Promise<RawLive> {
  return get<RawLive>(`/event/${gameweek}/live/`);
}

/** One player's match-by-match season, keyed by the per-season `id`: cache it under `code`, never persist the id. */
export function fetchElementSummary(elementId: number): Promise<RawElementSummary> {
  return get<RawElementSummary>(`/element-summary/${elementId}/`);
}
