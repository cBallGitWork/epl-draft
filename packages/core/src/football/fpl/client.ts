import { FPL_API_BASE } from "../../config";
import type { RawBootstrap, RawFixture, RawLive } from "./raw";

// All FPL network I/O lives here and nowhere else, so the mapping stays pure and
// unit-testable. FPL's API is public and unauthenticated — no cookies, no secrets,
// which is exactly why the football layer can run from day one while the Fantrax
// league layer is still waiting on a draft.

/** Plain fetch, standard options only. Freshness is the route's business: a Next
 *  segment's `revalidate` bounds how stale a rendered page may be, and expressing
 *  it a second time here would mean a Next-specific option inside core, which
 *  §5 forbids and which nothing outside Next would honour anyway. */
async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${FPL_API_BASE}${path}`, {
    headers: { "User-Agent": "epl-draft/0.1 (league companion)" },
  });
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
