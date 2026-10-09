import { beforeEach, describe, expect, it, vi } from "vitest";
import { FantraxError, ProviderError, type FootballSnapshot } from "@epl/core";
import { liveTie } from "./liveTie";

const football = vi.fn<() => Promise<FootballSnapshot>>();
const squads = vi.fn<() => Promise<unknown>>();
const reader = vi.fn<() => Promise<string | null>>();
const scores = new Map([["t1", { points: 40 }], ["t2", { points: 31 }], ["t3", { points: 44 }]]);

vi.mock("next/server", () => ({ connection: async () => {} }));
vi.mock("../../football", () => ({ footballNow: () => football(), speaksForNow: () => true }));
vi.mock("../../squads", () => ({ getLeagueSquads: () => squads() }));
vi.mock("../../scoreboard", () => ({ liveScores: async () => ({ scores, refused: null }) }));
vi.mock("../../session", () => ({ myTeamId: () => reader() }));
vi.mock("@/app/league/routes", () => ({ matchupHref: (id: string, _gw?: number, _view?: string, vs?: string) => `/league/matchups/${id}${vs === undefined ? "" : `?vs=${vs}`}` }));

const round = (status: string) => ({ fixtures: [{ status }] }) as unknown as FootballSnapshot;

beforeEach(() => {
  football.mockReset();
  squads.mockReset();
  reader.mockReset();
  reader.mockResolvedValue(null);
});

describe("liveTie", () => {
  it("never asks the league when no football is being played", async () => {
    football.mockResolvedValue(round("finished"));
    expect(await liveTie()).toEqual([]);
    expect(squads).not.toHaveBeenCalled();
  });

  it("is no strip, not a broken layout, when Fantrax cannot be reached", async () => {
    football.mockResolvedValue(round("live"));
    squads.mockRejectedValue(new ProviderError("ECONNRESET", "www.fantrax.com /fxea → ECONNRESET"));
    expect(await liveTie()).toEqual([]);
  });

  it("is no strip when Fantrax answers with an error status", async () => {
    football.mockResolvedValue(round("live"));
    squads.mockRejectedValue(new FantraxError("getTeamRosters", "503", "Service Unavailable"));
    expect(await liveTie()).toEqual([]);
  });

  it("is no strip when FPL cannot be reached", async () => {
    football.mockRejectedValue(new ProviderError("TIMEOUT", "fantasy.premierleague.com / → TIMEOUT"));
    expect(await liveTie()).toEqual([]);
  });

  it("still throws a fault of our own", async () => {
    football.mockResolvedValue(round("live"));
    squads.mockRejectedValue(new TypeError("cannot read teams of undefined"));
    await expect(liveTie()).rejects.toThrow(TypeError);
  });

  it("gives both ties of a double header, the second opened by name", async () => {
    football.mockResolvedValue(round("live"));
    reader.mockResolvedValue("t1");
    const teams = [{ teamId: "t1", name: "One" }, { teamId: "t2", name: "Two" }, { teamId: "t3", name: "Three" }];
    const matchups = [{ period: 34, homeTeamId: "t1", awayTeamId: "t2" }, { period: 34, homeTeamId: "t3", awayTeamId: "t1" }];
    squads.mockResolvedValue({ period: { teams: [] }, info: { matchups, teams }, roundPeriod: 34 });
    expect(await liveTie()).toEqual([
      { yours: 40, theirs: 31, opponent: "Two", href: "/league/matchups/t1" },
      { yours: 40, theirs: 44, opponent: "Three", href: "/league/matchups/t1?vs=t3" },
    ]);
  });
});
