// When to try again, and when to stop. Pure on purpose: the interesting part of
// a retry policy is the arithmetic, and arithmetic should not need a server to
// test. The sleeping and the randomness live in `fetch.ts`, at the edge.
//
// Outside both layers, because it belongs to neither. Both providers front their
// APIs with the same kind of WAF and answer 429 the same way, but `league/` may
// never import `football/` — so a shared policy has to sit somewhere that is not
// either of them. This is transport, not domain: it knows about status codes and
// headers, and nothing about football or fantasy.

/** Only these deserve a second attempt.
 *
 *  429 is the provider asking us to slow down and 5xx is the provider having a
 *  bad moment; both pass. A 404 does not — retrying it means asking the same
 *  wrong question three times, and FPL answers 404 for a gameweek that does not
 *  exist, which is an answer rather than a fault. */
export function worthRetrying(status: number): boolean {
  return status === 429 || (status >= 500 && status < 600);
}

/** How long to wait before attempt `attempt` (1-based), in milliseconds.
 *
 *  `Retry-After` wins when the provider sends one — it is them telling us the
 *  answer, and guessing shorter is how a rate limit becomes a ban. Both forms
 *  are honoured: a count of seconds, and an HTTP date.
 *
 *  Otherwise exponential from `base`, with jitter. `jitter01` is a number in
 *  [0,1) supplied by the caller rather than drawn here, because randomness inside
 *  a pure function makes it untestable — §5's rule, and the reason this file has
 *  a test at all. Jitter matters: sixteen phones refreshing at 15:00 back off in
 *  lockstep without it, and retry as one burst. */
export function retryDelay(
  attempt: number,
  retryAfter: string | null,
  base: number,
  jitter01: number,
  now: number,
): number {
  const stated = statedDelay(retryAfter, now);
  if (stated !== null) return stated;

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
