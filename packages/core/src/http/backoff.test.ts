import { describe, expect, it } from "vitest";
import { retryDelay, worthRetrying } from "./backoff";

const NOW = Date.parse("2026-08-21T19:00:00Z");

describe("worthRetrying", () => {
  it("retries the provider's problems, not ours", () => {
    expect(worthRetrying(429)).toBe(true);
    expect(worthRetrying(503)).toBe(true);
    // Asking the same wrong question three times is not politeness. FPL answers
    // 404 for a gameweek that does not exist, which is an answer.
    expect(worthRetrying(404)).toBe(false);
    expect(worthRetrying(400)).toBe(false);
  });
});

describe("retryDelay", () => {
  it("backs off exponentially from the base", () => {
    expect(retryDelay(1, null, 500, 0, NOW)).toBe(500);
    expect(retryDelay(2, null, 500, 0, NOW)).toBe(1000);
    expect(retryDelay(3, null, 500, 0, NOW)).toBe(2000);
  });

  it("spreads simultaneous callers apart", () => {
    // Sixteen phones refreshing at 15:00 would otherwise back off in lockstep
    // and retry as one burst — which is the thing being avoided, not caused.
    expect(retryDelay(1, null, 500, 0.5, NOW)).toBe(750);
    expect(retryDelay(1, null, 500, 0.9, NOW)).toBe(950);
  });

  it("obeys Retry-After in seconds, however long", () => {
    // Guessing shorter than they asked is how a rate limit becomes a ban.
    expect(retryDelay(1, "30", 500, 0.9, NOW)).toBe(30_000);
    expect(retryDelay(3, "2", 500, 0, NOW)).toBe(2000);
  });

  it("obeys Retry-After as an HTTP date", () => {
    expect(retryDelay(1, "Fri, 21 Aug 2026 19:00:10 GMT", 500, 0, NOW)).toBe(10_000);
  });

  it("never sleeps a negative amount for a date already gone", () => {
    expect(retryDelay(1, "Fri, 21 Aug 2026 18:59:00 GMT", 500, 0, NOW)).toBe(0);
  });

  it("does not read an empty header as 'try again now'", () => {
    // `Headers.get` gives "" for a header that is present but empty, and
    // `Number("")` is 0 — so the obvious coercion turns a rate limit into a
    // tight loop against the provider that just asked us to stop.
    expect(retryDelay(1, "", 500, 0, NOW)).toBe(500);
    expect(retryDelay(2, "   ", 500, 0, NOW)).toBe(1000);
  });

  it("still honours an explicit zero", () => {
    expect(retryDelay(1, "0", 500, 0.9, NOW)).toBe(0);
  });

  it("falls back to the schedule when the header makes no sense", () => {
    // An unreadable header is no instruction, not an instruction to wait zero.
    expect(retryDelay(2, "soon", 500, 0, NOW)).toBe(1000);
  });
});
