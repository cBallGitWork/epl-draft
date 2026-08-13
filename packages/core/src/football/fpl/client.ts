import {
  FPL_API_BASE,
  HTTP_BACKOFF_BASE_MS,
  HTTP_RETRIES,
  HTTP_USER_AGENT,
} from "../../config";
import { retryDelay, worthRetrying } from "../../http/backoff";
import type { RawBootstrap, RawFixture, RawLive } from "./raw";

// All FPL network I/O lives here and nowhere else, so the mapping stays pure and
// unit-testable. FPL's API is public and unauthenticated — no cookies, no secrets,
// which is exactly why the football layer can run from day one while the Fantrax
// league layer is still waiting on a draft.
//
// The clock and the randomness this file needs are I/O, and this is the edge —
// which is why the policy they serve lives in `backoff.ts`, pure and tested,
// rather than here where nothing could reach it.

/** Fetch, with enough manners to survive sixteen phones at three o'clock.
 *
 *  Freshness is deliberately not expressed here. A Next segment's `revalidate`
 *  bounds how stale a rendered page may be, and saying it again inside core would
 *  mean a Next-specific option in a package that must not know about Next (§5),
 *  which nothing outside Next would honour anyway. */
async function get<T>(path: string): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(`${FPL_API_BASE}${path}`, {
      headers: { "User-Agent": HTTP_USER_AGENT },
    });
    if (res.ok) return (await res.json()) as T;

    // Give up loudly rather than degrade quietly: a caller that gets an error can
    // say so on screen, and §2 forbids swallowing this into a default.
    if (attempt > HTTP_RETRIES || !worthRetrying(res.status)) {
      throw new Error(`FPL ${path} → ${res.status}`);
    }

    await sleep(
      retryDelay(
        attempt,
        res.headers.get("Retry-After"),
        HTTP_BACKOFF_BASE_MS,
        Math.random(),
        Date.now(),
      ),
    );
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
