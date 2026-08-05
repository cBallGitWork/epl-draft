import { FPL_API_BASE, REVALIDATE } from "../../config";
import type { RawBootstrap, RawFixture, RawLive } from "./raw";

// All FPL network I/O lives here and nowhere else, so the mapping stays pure and
// unit-testable. FPL's API is public and unauthenticated — no cookies, no secrets,
// which is exactly why the football layer can run from day one while the Fantrax
// league layer is still waiting on a draft.

/** FPL rate-limits aggressively when hammered, and the live page polls. Cache at
 *  the fetch layer and let callers decide freshness via `revalidate`. */
async function get<T>(path: string, revalidate: number): Promise<T> {
  // `next` is Next's own extension to RequestInit and is inert under a plain
  // fetch. Typed inline so core does not depend on Next's global augmentation —
  // see PLATFORM_NOTES on the §5 framework-agnosticism tension this leaves open.
  const init: RequestInit & { next: { revalidate: number } } = {
    next: { revalidate },
    headers: { "User-Agent": "epl-draft/0.1 (league companion)" },
  };
  const res = await fetch(`${FPL_API_BASE}${path}`, init);
  if (!res.ok) throw new Error(`FPL ${path} → ${res.status}`);
  return (await res.json()) as T;
}

/** Players, clubs and gameweeks. Large (~1.3 MB) and changes slowly outside of
 *  price changes and news, so it tolerates a long cache. */
export function fetchBootstrap(): Promise<RawBootstrap> {
  return get<RawBootstrap>("/bootstrap-static/", REVALIDATE.bootstrap);
}

/** Fixtures for one gameweek, or the whole season when `gameweek` is omitted. */
export function fetchFixtures(gameweek?: number): Promise<RawFixture[]> {
  const q = gameweek == null ? "" : `?event=${gameweek}`;
  return get<RawFixture[]>(`/fixtures/${q}`, REVALIDATE.fixtures);
}

/** Live per-player stats for a gameweek. Empty (`{elements: []}`) until the first
 *  match of that gameweek kicks off. Short cache — this is the live path. */
export function fetchLive(gameweek: number): Promise<RawLive> {
  return get<RawLive>(`/event/${gameweek}/live/`, REVALIDATE.live);
}
