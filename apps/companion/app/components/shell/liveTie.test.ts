import { beforeEach, describe, expect, it, vi } from "vitest";
import { FantraxError, ProviderError, type FootballSnapshot } from "@epl/core";
import { liveTie } from "./liveTie";

const football = vi.fn<() => Promise<FootballSnapshot>>();
const squads = vi.fn<() => Promise<unknown>>();

vi.mock("next/server", () => ({ connection: async () => {} }));
vi.mock("../../football", () => ({ footballNow: () => football(), speaksForNow: () => true }));
vi.mock("../../squads", () => ({ getLeagueSquads: () => squads() }));
vi.mock("../../scoreboard", () => ({ liveScores: async () => ({ scores: new Map(), refused: null }) }));
vi.mock("../../session", () => ({ myTeamId: async () => null }));
vi.mock("@/app/league/routes", () => ({ matchupHref: (id: string) => `/league/matchups/${id}` }));

const round = (status: string) => ({ fixtures: [{ status }] }) as unknown as FootballSnapshot;

beforeEach(() => {
  football.mockReset();
  squads.mockReset();
});

describe("liveTie", () => {
  it("never asks the league when no football is being played", async () => {
    football.mockResolvedValue(round("finished"));
    expect(await liveTie()).toBeNull();
    expect(squads).not.toHaveBeenCalled();
  });

  it("is no strip, not a broken layout, when Fantrax cannot be reached", async () => {
    football.mockResolvedValue(round("live"));
    squads.mockRejectedValue(new ProviderError("ECONNRESET", "www.fantrax.com /fxea → ECONNRESET"));
    expect(await liveTie()).toBeNull();
  });

  it("is no strip when Fantrax answers with an error status", async () => {
    football.mockResolvedValue(round("live"));
    squads.mockRejectedValue(new FantraxError("getTeamRosters", "503", "Service Unavailable"));
    expect(await liveTie()).toBeNull();
  });

  it("is no strip when FPL cannot be reached", async () => {
    football.mockRejectedValue(new ProviderError("TIMEOUT", "fantasy.premierleague.com / → TIMEOUT"));
    expect(await liveTie()).toBeNull();
  });

  it("still throws a fault of our own", async () => {
    football.mockResolvedValue(round("live"));
    squads.mockRejectedValue(new TypeError("cannot read teams of undefined"));
    await expect(liveTie()).rejects.toThrow(TypeError);
  });
});
