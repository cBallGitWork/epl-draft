import { describe, expect, it } from "vitest";
import { markCalls, predictionTies } from "./predictions";
import type { EditionTie } from "./published";
import type { StoryResult } from "./types";

const pairing = (home: string, away: string) => ({
  home: { teamId: home, name: home },
  away: { teamId: away, name: away },
});

const result = (winner: string, loser: string): StoryResult => ({
  winner: { teamId: winner, name: winner, points: 45 },
  loser: { teamId: loser, name: loser, points: 31 },
  margin: 14,
});

const tie = (over: Partial<EditionTie> = {}): EditionTie => ({
  homeTeamId: "a",
  awayTeamId: "b",
  line: "Tight.",
  callsTeamId: "a",
  ...over,
});

describe("predictionTies", () => {
  it("carries Fantrax's projection per side, and absence as absence", () => {
    const ties = predictionTies(
      [pairing("a", "b")],
      new Map([["a", { teamId: "a", points: 41.5 }]]),
    );
    expect(ties[0].homeProjected).toBe(41.5);
    // "No guess" and "we think nobody scores" are different claims, and only
    // the first is honest about a projection Fantrax withheld.
    expect(ties[0].awayProjected).toBeNull();
  });
});

describe("markCalls", () => {
  it("counts only the ties he called, and only the ones that produced a result", () => {
    const marked = markCalls(
      [
        tie({ homeTeamId: "a", awayTeamId: "b", callsTeamId: "a" }),
        tie({ homeTeamId: "c", awayTeamId: "d", callsTeamId: "d" }),
        // Declined: not a wrong answer, and folding it in would make silence
        // the cheapest way to look right.
        tie({ homeTeamId: "e", awayTeamId: "f", callsTeamId: null }),
        // Called, but the tie is still being played — not a call he got wrong.
        tie({ homeTeamId: "g", awayTeamId: "h", callsTeamId: "g" }),
      ],
      [result("a", "b"), result("c", "d")],
    );
    expect(marked).toEqual({ right: 1, called: 2 });
  });

  it("answers null when there is nothing to mark", () => {
    expect(markCalls(undefined, [])).toBeNull();
    expect(markCalls([tie({ callsTeamId: null })], [result("a", "b")])).toBeNull();
  });

  it("marks a call whichever side of the tie he took", () => {
    expect(markCalls([tie({ callsTeamId: "b" })], [result("b", "a")])).toEqual({ right: 1, called: 1 });
  });
});
