import { FETCH_TIMEOUT_MS, HTTP_BACKOFF_BASE_MS, HTTP_RETRIES, HTTP_USER_AGENT } from "../config";
import { droppedConnection, retryDelay, worthRetrying } from "./backoff";
import { ProviderError } from "./errors";

// One request, asked politely: the browser User-Agent, a deadline, and backing off when told to.
// Shared by both provider layers, which may not import each other; the clock and the randomness
// live here, at the edge, so `backoff.ts` stays pure.

/** Methods safe to send twice without the caller vouching for them. */
const IDEMPOTENT_METHODS = new Set(["GET", "HEAD"]);

const TIMEOUT = "TIMEOUT";

/** Fetch, retrying a busy provider or a dropped connection, but only a request safe to send twice:
 *  a GET, a HEAD, or one the caller marks `idempotent`. Returns the last response whether or not it
 *  is ok; throws an `unreachable` ProviderError when no response came at all. */
export async function politeFetch(
  url: string,
  init: RequestInit = {},
  { idempotent = IDEMPOTENT_METHODS.has((init.method ?? "GET").toUpperCase()) } = {},
): Promise<Response> {
  for (let attempt = 1; ; attempt++) {
    const mayRetry = idempotent && attempt <= HTTP_RETRIES;
    let res: Response;
    try {
      res = await fetch(url, {
        ...init,
        headers: { "User-Agent": HTTP_USER_AGENT, ...init.headers },
        // A deadline per attempt: a provider that never answers would otherwise hold the render.
        signal: init.signal ?? AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });
    } catch (error: unknown) {
      const code = failureCode(error);
      if (code === null) throw error;
      if (!mayRetry || code === TIMEOUT) throw unreachable(url, code);
      await waitedOut(attempt, null);
      continue;
    }
    if (res.ok || !mayRetry || !worthRetrying(res.status)) return res;
    // A wait too long to sit through goes back to the caller as the refusal it is.
    if (!(await waitedOut(attempt, res.headers.get("Retry-After")))) return res;
  }
}

/** "TIMEOUT", a dropped connection's code, or null for a failure that is ours and not the
 *  provider's to answer for: a bad URL, a caller's own abort. */
function failureCode(error: unknown): string | null {
  if (!(error instanceof Error)) return null;
  if (error.name === "TimeoutError") return TIMEOUT;
  const cause = error instanceof TypeError ? error.cause : undefined;
  const code = typeof cause === "object" && cause !== null && "code" in cause ? cause.code : null;
  return typeof code === "string" && droppedConnection(code) ? code : null;
}

/** No answer at all, named by host and path because no provider client is in the loop. */
function unreachable(url: string, code: string): ProviderError {
  const { host, pathname } = new URL(url);
  return new ProviderError(host, pathname, code, "unreachable", `${host} ${pathname} → ${code}`);
}

/** Sleeps out the backoff before the next attempt; false when asked to wait longer than is worth it. */
async function waitedOut(attempt: number, retryAfter: string | null): Promise<boolean> {
  const delay = retryDelay(attempt, retryAfter, HTTP_BACKOFF_BASE_MS, Math.random(), Date.now());
  if (delay === null) return false;
  await new Promise((resolve) => setTimeout(resolve, delay));
  return true;
}
