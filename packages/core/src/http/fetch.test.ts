import { afterEach, describe, expect, it, vi } from "vitest";
import { politeFetch } from "./fetch";

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

function capture(): RequestInit[] {
  const seen: RequestInit[] = [];
  vi.stubGlobal("fetch", async (_url: string, init: RequestInit) => {
    seen.push(init);
    return new Response("{}", { status: 200 });
  });
  return seen;
}

/** Stubs fetch to give each answer in turn, repeating the last; returns the call count. */
function serve(...answers: (() => Response)[]): { calls: number } {
  const count = { calls: 0 };
  vi.stubGlobal("fetch", async () => {
    const answer = answers[Math.min(count.calls, answers.length - 1)];
    count.calls++;
    return answer();
  });
  return count;
}

const busy = (retryAfter: string) => () =>
  new Response("", { status: 429, headers: { "Retry-After": retryAfter } });
const fine = () => new Response("{}", { status: 200 });

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
