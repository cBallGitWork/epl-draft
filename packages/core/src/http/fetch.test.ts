import { afterEach, describe, expect, it, vi } from "vitest";
import { politeFetch } from "./fetch";

afterEach(() => vi.unstubAllGlobals());

function capture(): RequestInit[] {
  const seen: RequestInit[] = [];
  vi.stubGlobal("fetch", async (_url: string, init: RequestInit) => {
    seen.push(init);
    return new Response("{}", { status: 200 });
  });
  return seen;
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
});
