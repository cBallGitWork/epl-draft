import { FETCH_TIMEOUT_MS, HTTP_BACKOFF_BASE_MS, HTTP_RETRIES, HTTP_USER_AGENT } from "../config";
import { retryDelay, worthRetrying } from "./backoff";

// One request, asked politely. The third caller is what earned this file: FPL's
// client and Fantrax's two surfaces all want the same browser User-Agent and the
// same answer to being told "not now", and neither provider layer may import the
// other, so the loop has nowhere to live but outside both.
//
// The clock and the randomness are here rather than in `backoff.ts` because they
// are I/O, and this is the edge. `backoff.ts` stays pure and testable.

/** Fetch, retrying only what the provider says is worth retrying.
 *
 *  Returns the last response whether or not it is ok. The caller owns the error
 *  type — FPL throws a plain `Error`, Fantrax throws a `FantraxError` carrying
 *  the method name — and a shared transport has no business choosing between
 *  them. */
export async function politeFetch(url: string, init: RequestInit = {}): Promise<Response> {
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(url, {
      ...init,
      headers: { "User-Agent": HTTP_USER_AGENT, ...init.headers },
      // A deadline per attempt: a provider that never answers would otherwise hold the render.
      signal: init.signal ?? AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (res.ok || attempt > HTTP_RETRIES || !worthRetrying(res.status)) return res;

    const delay = retryDelay(
      attempt,
      res.headers.get("Retry-After"),
      HTTP_BACKOFF_BASE_MS,
      Math.random(),
      Date.now(),
    );
    // A wait too long to sit through goes back to the caller as the refusal it is.
    if (delay === null) return res;
    await sleep(delay);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
