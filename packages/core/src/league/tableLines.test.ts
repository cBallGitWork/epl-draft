import { describe, expect, it } from "vitest";
import { tableLines } from "./tableLines";

const unders = (semis: number | null, teams: number) => tableLines(semis, teams).map((line) => line.under);

describe("tableLines", () => {
  it("draws the prize, the playoffs, the play-in and the Plate for our ten and Fantrax's four", () => {
    expect(tableLines(4, 10)).toEqual([
      { under: 1, label: "£30 · picks semi opponent" },
      { under: 3, label: "Playoffs" },
      { under: 5, label: "Play-in" },
      { under: 8, label: "Plate" },
    ]);
  });

  it("draws nothing for a league that runs no playoff", () => {
    expect(tableLines(null, 10)).toEqual([]);
  });

  it("moves the playoffs and the play-in with Fantrax's count", () => {
    expect(unders(6, 12)).toEqual([1, 5, 7, 8]);
  });

  it("never draws under the bottom row", () => {
    expect(unders(4, 8)).toEqual([1, 3, 5]);
    expect(unders(4, 5)).toEqual([1, 3]);
  });

  it("drops a line that would sit on or above the one before it", () => {
    expect(unders(2, 10)).toEqual([1, 3, 8]);
    expect(unders(7, 10)).toEqual([1, 6, 8]);
  });
});
