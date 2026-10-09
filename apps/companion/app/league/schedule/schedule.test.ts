import { describe, expect, it, vi } from "vitest";
import { getSchedule } from "./schedule";

// Next's cache as the schedule meets it: a read nested inside another's skips its own cache and goes live.
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

vi.mock("../../leagueCache", () => ({
  leagueCache:
    <A extends unknown[], R>(key: string, read: (...args: A) => Promise<R>) =>
    (...args: A) =>
      inCache.run(key, () => read(...args)),
}));
vi.mock("../../football", () => ({ seasonFixtures: ownCache("season-fixtures", []) }));
vi.mock("../../standings", () => ({ leagueTable: ownCache("standings-page", []) }));
vi.mock("@epl/core", async (actual) => {
  const core = await actual<typeof import("@epl/core")>();
  return {
    ...core,
    fetchLeagueInfo: async () => {
      throw new core.FantraxError("getLeagueInfo", "INVALID_LEAGUE", "no such league");
    },
  };
});

describe("getSchedule", () => {
  // The squads read learnt this on 9 Oct: FPL refusing from inside a Fantrax cache reads as Fantrax not answering,
  // and every refresh asks FPL live.
  it("asks only Fantrax from inside its cache; the fixtures and the table come from their own", async () => {
    expect(await getSchedule()).toEqual({ unavailable: expect.any(String) });
    expect(nested).toEqual([]);
  });
});
