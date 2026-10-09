import { describe, expect, it, vi } from "vitest";
import { readCalendar } from "./round";

// Next's cache as the calendar meets it: a read nested inside another's skips its own cache and goes live.
const { inCache, ownCache, nested } = await vi.hoisted(async () => {
  const { AsyncLocalStorage } = await import("node:async_hooks");
  const inCache = new AsyncLocalStorage<string>();
  const nested: string[] = [];
  /** A read with a cache of its own, which notes being asked from inside another's. */
  const ownCache = <R,>(name: string, answer: R) => async () => {
    if (inCache.getStore() !== undefined) nested.push(name);
    return answer;
  };
  return { inCache, ownCache, nested };
});

vi.mock("./leagueCache", () => ({
  leagueCache:
    <A extends unknown[], R>(key: string, read: (...args: A) => Promise<R>) =>
    (...args: A) => {
      if (inCache.getStore() !== undefined) nested.push(key);
      return inCache.run(key, () => read(...args));
    },
}));
vi.mock("./football", () => ({ seasonKickoffs: ownCache("season-fixtures", []) }));
vi.mock("@epl/core", async (actual) => {
  const core = await actual<typeof import("@epl/core")>();
  return {
    ...core,
    fetchLeagueInfo: async () => {
      throw new core.FantraxError("getLeagueInfo", "INVALID_LEAGUE", "no such league");
    },
  };
});

describe("readCalendar", () => {
  it("asks the league and FPL's kickoffs each from its own cache, never from inside another", async () => {
    // Nested, an FPL refusal emptied the calendar for a window and every refresh asked FPL live.
    expect(await readCalendar()).toEqual([]);
    expect(nested).toEqual([]);
  });
});
