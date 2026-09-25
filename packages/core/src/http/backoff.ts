// When to try again, and when to stop: statuses, socket codes and Retry-After, and nothing about
// football or fantasy. Pure, so the policy is testable; the sleeping and the randomness live in
// `fetch.ts`. Outside both layers because both share it and neither may import the other.

import { HTTP_RETRY_AFTER_MAX_MS } from "../config";

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

/** `Retry-After` as milliseconds, or null when absent or unintelligible.
 *
 *  A header we cannot read is not an error and not a zero — it is simply no
 *  instruction, and the exponential schedule stands. */
function statedDelay(retryAfter: string | null, now: number): number | null {
  if (retryAfter === null) return null;

  // `Number("")` is 0, and `Headers.get` returns "" for a header that is present
  // but empty — so without this an empty Retry-After would read as "try again
  // immediately", turning a rate limit into a tight loop against the provider
  // that just asked us to stop.
  const stated = retryAfter.trim();
  if (stated === "") return null;

  const seconds = Number(stated);
  if (Number.isFinite(seconds) && seconds >= 0) return Math.round(seconds * 1000);

  const at = Date.parse(stated);
  if (Number.isNaN(at)) return null;
  // A date already in the past means "now", never a negative sleep.
  return Math.max(0, at - now);
}
