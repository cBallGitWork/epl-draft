import { FPL_API_BASE } from "../../config";
import { statusError } from "../../http/errors";
import { politeFetch } from "../../http/fetch";
import { readJson } from "../../http/json";
import type { RawBootstrap, RawElementSummary, RawFixture, RawLive, RawRegion } from "./raw";

// All FPL network I/O lives here and nowhere else, so the mapping stays pure and
// unit-testable. FPL's API is public and unauthenticated — no cookies, no secrets,
// which is exactly why the football layer can run from day one while the Fantrax
// league layer is still waiting on a draft.
//
// Manners — the browser User-Agent, and backing off when told to — live in
// `http/fetch.ts`, which both providers share because neither layer may import
// the other.

/** Freshness is deliberately not expressed here. A Next segment's `revalidate`
 *  bounds how stale a rendered page may be, and saying it again inside core would
 *  mean a Next-specific option in a package that must not know about Next (§5),
 *  which nothing outside Next would honour anyway. */
async function get<T>(path: string): Promise<T> {
  const res = await politeFetch(`${FPL_API_BASE}${path}`);
  // Give up loudly rather than degrade quietly: a caller that gets an error can
  // say so on screen, and §2 forbids swallowing this into a default.
  if (!res.ok) throw statusError("FPL", path, res.status);
  return (await readJson(res, "FPL", path)) as T;
}

/** Players, clubs and gameweeks. Large (~1.3 MB) and changes slowly outside of
 *  price changes and news. */
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

/** One player's match-by-match season, keyed by FPL's per-season element `id`.
 *
 *  The id is the reason this read is fenced off from everything persisted: ids
 *  are recycled every summer (CODE_RULES §3), so a caller resolves one from
 *  `playerByCode` for the request it is serving and caches the answer under the
 *  season-stable `code`. Nothing writes an element id to disk. */
export function fetchElementSummary(elementId: number): Promise<RawElementSummary> {
  return get<RawElementSummary>(`/element-summary/${elementId}/`);
}
