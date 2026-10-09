import { describe, expect, it, vi } from "vitest";
import { statsLeaguePeriods } from "./statsLeague";

// Next's caches as plain reads: what is under test is what an outage does on a cold key.
vi.mock("next/cache", () => ({ unstable_cache: <F>(read: F) => read }));
vi.mock("./leagueCache", () => ({ leagueCache: <F>(_key: string, read: F) => read }));
vi.mock("@epl/core", async (actual) => {
  const core = await actual<typeof import("@epl/core")>();
  return {
    ...core,
    fetchLeagueInfo: async () => {
      throw new core.FantraxError("getLeagueInfo", "ECONNRESET", "no answer", "unreachable");
    },
  };
});

describe("statsLeaguePeriods", () => {
  it("is null, the screens' own unreadable answer, when Fantrax does not answer for the stats league's calendar", async () => {
    // It threw instead, and took Players, Prem › Data and a squad's Stats down with it.
    await expect(statsLeaguePeriods(["SOT"], new Date("2026-10-09T12:00:00Z"))).resolves.toBeNull();
  });
});
