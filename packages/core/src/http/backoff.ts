// When to try again and when to stop, shared by both layers; the sleeping and the randomness live in `fetch.ts`.

import { HTTP_RETRY_AFTER_MAX_MS } from "../config";
import { MS_PER_SECOND } from "../time";

/** A busy (429) or failing (5xx) provider; never a 404, which is an answer and fails the same again. */
export function worthRetrying(status: number): boolean {
  return status === 429 || (status >= 500 && status < 600);
}

/** A connection reset, refused or unresolved, and undici's own socket failures: a blip, like a 5xx. */
export function droppedConnection(code: string): boolean {
  return DROPPED_CONNECTION.has(code) || code.startsWith("UND_ERR_");
}

const DROPPED_CONNECTION = new Set(["ECONNRESET", "ENOTFOUND", "EAI_AGAIN", "ECONNREFUSED"]);

/** Milliseconds before attempt `attempt` (1-based): never less than a stated `Retry-After`, and
 *  null when that asks for more than `HTTP_RETRY_AFTER_MAX_MS`; otherwise exponential from `base`
 *  with the caller's jitter in [0,1), so simultaneous callers do not retry as one burst. */
export function retryDelay(
  attempt: number,
  retryAfter: string | null,
  base: number,
  jitter01: number,
  now: number,
): number | null {
  const stated = statedDelay(retryAfter, now);
  if (stated !== null) return stated > HTTP_RETRY_AFTER_MAX_MS ? null : stated;

  const exponential = base * 2 ** (attempt - 1);
  return Math.round(exponential * (1 + jitter01));
}

/** `Retry-After` as milliseconds, or null when absent or unreadable, so the exponential schedule stands. */
function statedDelay(retryAfter: string | null, now: number): number | null {
  if (retryAfter === null) return null;

  // An empty header reads `Number("")`, 0: without this a rate limit becomes a tight retry loop.
  const stated = retryAfter.trim();
  if (stated === "") return null;

  const seconds = Number(stated);
  if (Number.isFinite(seconds) && seconds >= 0) return Math.round(seconds * MS_PER_SECOND);

  const at = Date.parse(stated);
  if (Number.isNaN(at)) return null;
  // A date already in the past means "now", never a negative sleep.
  return Math.max(0, at - now);
}
