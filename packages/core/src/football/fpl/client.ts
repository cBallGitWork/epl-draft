import { FPL_API_BASE } from "../../config";
import { politeFetch } from "../../http/fetch";
import type { RawBootstrap, RawFixture, RawLive } from "./raw";

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
  if (!res.ok) throw new Error(`FPL ${path} → ${res.status}`);
  return (await res.json()) as T;
}

/** Players, clubs and gameweeks. Large (~1.3 MB) and changes slowly outside of
 *  price changes and news. */
export function fetchBootstrap(): Promise<RawBootstrap> {
  return get<RawBootstrap>("/bootstrap-static/");
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
