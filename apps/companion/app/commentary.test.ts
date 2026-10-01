import { describe, expect, it, vi } from "vitest";
import { ProviderError } from "@epl/core";
import { roundBreaks, roundGoals } from "./commentary";

const round = vi.fn<(gameweek: number) => Promise<unknown>>();

vi.mock("./clock", () => ({ replayAt: () => null }));
vi.mock("./plFeed", () => ({
  plRound: (gameweek: number) => round(gameweek),
  plStream: async () => null,
  playerCodes: () => new Map(),
}));

const down = new ProviderError("503", "Premier League /fixtures → 503", "unreachable");

describe("the round's wire when the Premier League cannot answer", () => {
  it("has no goals rather than taking the Live tab down", async () => {
    round.mockRejectedValue(down);
    expect(await roundGoals(6, [])).toEqual([]);
  });

  it("has no breaks rather than taking the Live tab down", async () => {
    round.mockRejectedValue(down);
    expect(await roundBreaks(6)).toEqual([]);
  });

  it("still throws a bug of our own", async () => {
    round.mockRejectedValue(new TypeError("content is not iterable"));
    await expect(roundGoals(6, [])).rejects.toThrow(TypeError);
    await expect(roundBreaks(6)).rejects.toThrow(TypeError);
  });
});
