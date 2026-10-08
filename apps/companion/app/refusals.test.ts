import { describe, expect, it } from "vitest";
import { FantraxError, ProviderError } from "@epl/core";
import { orRefusal, refusedAs, tell } from "./refusals";

describe("orRefusal", () => {
  it("returns a refusal Fantrax meant, to be modelled and cached", async () => {
    const refused = new FantraxError("getTeamRosters", "NO_TEAMS", "no teams");
    expect(await orRefusal(Promise.reject(refused))).toBe(refused);
  });

  it("throws a Fantrax that could not answer, so the cache keeps its last good answer", async () => {
    const down = new FantraxError("getTeamRosters", "503", "Service Unavailable", "unreachable");
    await expect(orRefusal(Promise.reject(down))).rejects.toBe(down);
  });

  it("throws an answer that was not one", async () => {
    const garbled = new FantraxError("getStandings", "NO_DATA", "neither", "malformed");
    await expect(orRefusal(Promise.reject(garbled))).rejects.toBe(garbled);
  });

  it("throws a dropped connection and a bug of our own", async () => {
    const dropped = new ProviderError("ECONNRESET", "www.fantrax.com /fxea → ECONNRESET", "unreachable");
    await expect(orRefusal(Promise.reject(dropped))).rejects.toBe(dropped);
    await expect(orRefusal(Promise.reject(new TypeError("x")))).rejects.toThrow(TypeError);
  });
});

describe("refusedAs", () => {
  it("maps an answer, and answers a refusal Fantrax meant with the fallback", async () => {
    expect(await refusedAs(Promise.resolve(2), () => 0, (n) => n * 10)).toBe(20);
    const refused = new FantraxError("getTeamRosters", "NO_TEAMS", "no teams");
    expect(await refusedAs(Promise.reject(refused), (error) => error.code, () => "read")).toBe("NO_TEAMS");
  });

  it("still throws an outage", async () => {
    const down = new FantraxError("getTeamRosters", "503", "Service Unavailable", "unreachable");
    await expect(refusedAs(Promise.reject(down), () => null, () => "read")).rejects.toBe(down);
  });
});

describe("tell", () => {
  it("names Fantrax's method and code", () => {
    expect(tell(new FantraxError("getStandings", "503", "down", "unreachable"))).toBe("getStandings → 503");
  });

  it("names the host and path of a provider that never answered", () => {
    const dropped = new ProviderError("TIMEOUT", "www.fantrax.com /fxea/general/getLeagueInfo → TIMEOUT", "unreachable");
    expect(tell(dropped)).toBe("www.fantrax.com /fxea/general/getLeagueInfo → TIMEOUT");
  });
});
