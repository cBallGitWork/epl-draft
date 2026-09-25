import { vi } from "vitest";

// Test support only: stands in for the network, so no test ever reaches a provider.

/** Stubs fetch to give each answer in turn, repeating the last; counts the calls. */
export function serve(...answers: (() => Response)[]): { calls: number } {
  const count = { calls: 0 };
  vi.stubGlobal("fetch", async () => {
    const answer = answers[Math.min(count.calls, answers.length - 1)];
    count.calls++;
    return answer();
  });
  return count;
}

/** A 200 carrying a web page where JSON belongs, as a WAF challenge arrives. */
export const htmlPage = () =>
  new Response("<!doctype html><html><head><title>Just a moment...</title></head></html>", {
    status: 200,
    headers: { "content-type": "text/html; charset=UTF-8" },
  });

/** An answer with this status and no body. */
export const statusOnly = (status: number) => () => new Response(null, { status });
