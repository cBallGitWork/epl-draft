import { afterEach, describe, expect, it, onTestFinished, vi } from "vitest";
import { ProviderError } from "./errors";
import { serve, statusOnly } from "./fakeFetch";
import { politeFetch } from "./fetch";

afterEach(() => vi.useRealTimers());

function capture(): RequestInit[] {
  const seen: RequestInit[] = [];
  onTestFinished(() => {
    vi.unstubAllGlobals();
  });
  vi.stubGlobal("fetch", async (_url: string, init: RequestInit) => {
    seen.push(init);
    return new Response("{}", { status: 200 });
  });
  return seen;
}

const busy = (retryAfter: string) => () =>
  new Response("", { status: 429, headers: { "Retry-After": retryAfter } });
const fine = () => new Response("{}", { status: 200 });

/** A connection that failed under fetch, as undici reports it. */
const dropped = (code: string) => (): Response => {
  throw new TypeError("fetch failed", { cause: Object.assign(new Error(code), { code }) });
};

const timedOut = (): Response => {
  throw new DOMException("The operation was aborted due to timeout", "TimeoutError");
};

/** Runs a fetch through every backoff and settles it, rejection included. */
async function settle(pending: Promise<Response>): Promise<unknown> {
  const settled = pending.catch((e: unknown) => e);
  await vi.runAllTimersAsync();
  return settled;
}

describe("politeFetch", () => {
  it("gives every request a deadline, so a provider that never answers cannot hang a render", async () => {
    const seen = capture();
    await politeFetch("https://example.test/");
    expect(seen[0].signal).toBeInstanceOf(AbortSignal);
  });

  it("keeps a caller's own signal", async () => {
    const seen = capture();
    const own = new AbortController().signal;
    await politeFetch("https://example.test/", { signal: own });
    expect(seen[0].signal).toBe(own);
  });

  it("waits out a short Retry-After and asks again", async () => {
    vi.useFakeTimers();
    const count = serve(busy("1"), fine);
    const pending = politeFetch("https://example.test/");
    await vi.advanceTimersByTimeAsync(1000);
    expect((await pending).status).toBe(200);
    expect(count.calls).toBe(2);
  });

  it("returns a Retry-After of an hour at once rather than stall the request", async () => {
    vi.useFakeTimers();
    const count = serve(busy("3600"), fine);
    const res = await politeFetch("https://example.test/");
    expect(res.status).toBe(429);
    expect(count.calls).toBe(1);
  });
});

describe("politeFetch on a failed connection", () => {
  it("asks again after a dropped connection", async () => {
    vi.useFakeTimers();
    const count = serve(dropped("ECONNRESET"), fine);
    const res = await settle(politeFetch("https://example.test/api/x/"));
    expect((res as Response).status).toBe(200);
    expect(count.calls).toBe(2);
  });

  it("retries undici's own socket failures too", async () => {
    vi.useFakeTimers();
    const count = serve(dropped("UND_ERR_SOCKET"), fine);
    await settle(politeFetch("https://example.test/"));
    expect(count.calls).toBe(2);
  });

  it("names the host as unreachable when every attempt drops, not a TypeError", async () => {
    vi.useFakeTimers();
    const count = serve(dropped("ECONNRESET"));
    const error = await settle(politeFetch("https://example.test/api/x/?q=1"));
    expect(error).toBeInstanceOf(ProviderError);
    expect(error).toMatchObject({ code: "ECONNRESET", message: "example.test /api/x/ → ECONNRESET" });
    expect(count.calls).toBe(3);
  });

  it("does not retry a timeout, and says it was one", async () => {
    vi.useFakeTimers();
    const count = serve(timedOut, fine);
    const error = await settle(politeFetch("https://example.test/"));
    expect(error).toMatchObject({ name: "ProviderError", code: "TIMEOUT" });
    expect(count.calls).toBe(1);
  });

  it("passes through a failure it does not recognise", async () => {
    vi.useFakeTimers();
    const count = serve(dropped("CERT_HAS_EXPIRED"), fine);
    const error = await settle(politeFetch("https://example.test/"));
    expect(error).toBeInstanceOf(TypeError);
    expect(count.calls).toBe(1);
  });
});

describe("politeFetch and a request that is not safe to send twice", () => {
  it("never retries a POST", async () => {
    vi.useFakeTimers();
    const count = serve(statusOnly(503));
    const res = await settle(politeFetch("https://example.test/", { method: "POST" }));
    expect((res as Response).status).toBe(503);
    expect(count.calls).toBe(1);
  });

  it("never resends a POST whose connection dropped", async () => {
    vi.useFakeTimers();
    const count = serve(dropped("ECONNRESET"), fine);
    const error = await settle(politeFetch("https://example.test/", { method: "POST" }));
    expect(error).toMatchObject({ name: "ProviderError", code: "ECONNRESET" });
    expect(count.calls).toBe(1);
  });

  it("retries a POST the caller vouches for", async () => {
    vi.useFakeTimers();
    const count = serve(statusOnly(503));
    await settle(politeFetch("https://example.test/", { method: "POST" }, { idempotent: true }));
    expect(count.calls).toBe(3);
  });
});
