import { describe, expect, it, vi } from "vitest";
import { getLeagueSquads } from "./squads";

// Next's cache as the squads read meets it: a read nested inside another's skips its own cache and goes live.
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
    (...args: A) =>
      inCache.run(key, () => read(...args)),
}));
vi.mock("./football", () => ({
  footballNow: async () => ({ gameweek: 6 }),
  gameweekSnapshot: async () => ({ gameweek: 6 }),
  seasonKickoffs: ownCache("season-fixtures", []),
}));
vi.mock("./round", () => ({
  leagueInfo: ownCache("league-info", null),
  roundOf: ownCache("league-calendar", { gameweek: 6, period: 6 }),
}));
vi.mock("./session", () => ({ myTeamId: () => null }));
vi.mock("@epl/core", async (actual) => {
  const core = await actual<typeof import("@epl/core")>();
  return {
    ...core,
    fetchTeamRosters: async () => {
      throw new core.FantraxError("getTeamRosters", "NO_TEAMS", "no teams yet");
    },
  };
});

describe("getLeagueSquads", () => {
  // 9 Oct: FPL refused Vercel, the squads refresh read FPL's fixtures live from inside its cache, and a save
  // Fantrax had taken landed its manager on "Fantrax is not answering".
  it("asks only Fantrax from inside its cache; the kickoffs, the calendar and the rules come from their own", async () => {
    expect(await getLeagueSquads()).toEqual({ undrafted: expect.any(String) });
    expect(nested).toEqual([]);
  });
});
