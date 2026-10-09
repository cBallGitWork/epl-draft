import { describe, expect, it } from "vitest";
import { tradeStory, type TradeFigures } from "./brief";
import type { Trade } from "./trades";

const SHORT: Record<string, string> = { a: "Truffles", b: "Beef", c: "Hazza" };

const trade = (moves: [name: string, from: string, to: string][]): Trade => ({
  id: "t1",
  processedAt: null,
  period: 7,
  moves: moves.map(([playerName, fromTeamId, toTeamId], i) => ({
    fantraxId: `p${i}`,
    playerName,
    position: "D",
    clubName: i === 0 ? "Arsenal" : "Bournemouth",
    fromTeamId,
    toTeamId,
  })),
});

const story = (t: Trade, figures: Record<string, TradeFigures>, gameweek: number | null = 8) =>
  tradeStory({ trade: t, teamName: (id) => SHORT[id] ?? id, figures: (id) => figures[id] ?? { points: null, goals: null }, gameweek });

describe("tradeStory", () => {
  const swap = trade([["Gabriel Magalhaes", "b", "a"], ["Adrien Truffert", "a", "b"]]);

  it("heads the item with the man who has scored most, to the side that got him", () => {
    const told = story(swap, { p0: { points: 21, goals: 0 }, p1: { points: 34.5, goals: 2 } });
    expect(told.headline).toBe("Here we go! Adrien Truffert to Beef");
    expect(told.deck).toBe("Beef get Adrien Truffert from Truffles for Gabriel Magalhaes");
    expect(told.transfer).toEqual({ teamId: "b", team: "Beef" });
  });

  it("briefs every man with his club, his season and both sides, and the gameweek it takes effect", () => {
    const { brief } = story(swap, { p0: { points: 34, goals: 2 }, p1: { points: 21, goals: 0 } });
    expect(brief).toContain("- Truffles get Gabriel Magalhaes (D, Arsenal) from Beef. His season: 34 points, 2 goals.");
    // Zero is a stat: a man who has not scored has no goals, never a missing figure.
    expect(brief).toContain("- Beef get Adrien Truffert (D, Bournemouth) from Truffles. His season: 21 points, no goals.");
    expect(brief).toContain("It takes effect in gameweek 8.");
    expect(brief).toContain("THE MANAGERS IN IT: Truffles and Beef.");
  });

  it("says nothing of a figure it does not hold, nor of a gameweek the calendar cannot place", () => {
    const { brief } = story(swap, {}, null);
    expect(brief).toContain("- Truffles get Gabriel Magalhaes (D, Arsenal) from Beef.\n");
    expect(brief).not.toContain("His season");
    expect(brief).not.toContain("takes effect");
  });

  it("tells a three-way trade man by man, by where each went", () => {
    const told = story(trade([["Saliba", "a", "b"], ["Semenyo", "b", "c"], ["Isak", "c", "a"]]), {});
    expect(told.deck).toBe("Saliba to Beef, Semenyo to Hazza and Isak to Truffles");
    expect(told.headline).toBe("Here we go! Saliba to Beef");
  });

  it("names every man, side and club for the editor", () => {
    expect(story(swap, {}).names).toEqual(["Gabriel Magalhaes", "Adrien Truffert", "Truffles", "Beef", "Arsenal", "Bournemouth"]);
  });
});
