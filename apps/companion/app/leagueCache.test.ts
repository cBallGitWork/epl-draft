import { beforeEach, describe, expect, it, vi } from "vitest";
import { FantraxError, ProviderError } from "@epl/core";
import { leagueCache } from "./leagueCache";

// Next's cache as far as this file can see it: what a read stored, keyed as asked.
const stored = new Map<string, unknown>();

vi.mock("next/cache", () => ({
  unstable_cache:
    <A extends unknown[], R>(read: (...args: A) => Promise<R>, keys: string[]) =>
    async (...args: A): Promise<R> => {
      const key = JSON.stringify([...keys, ...args]);
      if (stored.has(key)) return stored.get(key) as R;
      const answer = await read(...args);
      stored.set(key, answer);
      return answer;
    },
}));

beforeEach(() => stored.clear());

/** A read that fails with `error` whatever gameweek it is asked for. */
const failing = (error: Error) => vi.fn<(gameweek: number) => Promise<object>>().mockRejectedValue(error);

const unavailable = (error: ProviderError, gameweek: number) => ({ unavailable: `${error.code} in ${gameweek}` });

describe("leagueCache", () => {
  it("serves the read, and keeps it", async () => {
    const cached = leagueCache("squads", async (gameweek: number): Promise<object> => ({ gameweek }), unavailable);
    expect(await cached(6)).toEqual({ gameweek: 6 });
    expect([...stored.values()]).toEqual([{ gameweek: 6 }]);
  });

  it("degrades a cold key when Fantrax cannot answer, and never stores the degraded answer", async () => {
    const down = new FantraxError("getTeamRosters", "503", "Service Unavailable", "unreachable");
    const cached = leagueCache("squads", failing(down), unavailable);
    expect(await cached(6)).toEqual({ unavailable: "503 in 6" });
    expect(stored.size).toBe(0);
  });

  it("degrades a provider the read leaned on, whichever layer it was", async () => {
    const fpl = new ProviderError("TIMEOUT", "fantasy.premierleague.com / → TIMEOUT", "unreachable");
    const cached = leagueCache("squads", failing(fpl), unavailable);
    expect(await cached(6)).toEqual({ unavailable: "TIMEOUT in 6" });
  });

  it("throws a bug of our own rather than dressing it as an outage", async () => {
    const cached = leagueCache("squads", failing(new TypeError("cannot read teams of undefined")), unavailable);
    await expect(cached(6)).rejects.toThrow(TypeError);
  });
});
