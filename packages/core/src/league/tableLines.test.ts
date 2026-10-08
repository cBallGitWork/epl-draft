import { describe, expect, it } from "vitest";
import { linesAfter, tableLines } from "./tableLines";

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

describe("linesAfter", () => {
  const table = (...ranks: number[]) => ranks.map((rank, at) => ({ teamId: `t${at + 1}`, rank }));
  const labels = (after: Map<string, { label: string }[]>) =>
    Object.fromEntries([...after].map(([teamId, lines]) => [teamId, lines.map((line) => line.label)]));

  it("draws each line under the team in the place it cuts at", () => {
    expect(labels(linesAfter(tableLines(4, 10), table(1, 2, 3, 4, 5, 6, 7, 8, 9, 10)))).toEqual({
      t1: ["£30 · picks semi opponent"],
      t3: ["Playoffs"],
      t5: ["Play-in"],
      t8: ["Plate"],
    });
  });

  it("draws a line that would part teams level on the table under the last of them", () => {
    expect(labels(linesAfter(tableLines(4, 10), table(1, 1, 3, 3, 5, 6, 6, 6, 9, 10)))).toEqual({
      t2: ["£30 · picks semi opponent"],
      t4: ["Playoffs"],
      t5: ["Play-in"],
      t8: ["Plate"],
    });
  });

  it("keeps both lines, in order, where two fall inside one tie", () => {
    expect(labels(linesAfter(tableLines(4, 10), table(1, 2, 3, 3, 3, 3, 7, 8, 9, 10)))).toEqual({
      t1: ["£30 · picks semi opponent"],
      t6: ["Playoffs", "Play-in"],
      t8: ["Plate"],
    });
  });

  it("draws nothing under the bottom row, so a table all level draws no line", () => {
    expect(linesAfter(tableLines(4, 10), table(1, 1, 1, 1, 1, 1, 1, 1, 1, 1)).size).toBe(0);
    expect(labels(linesAfter(tableLines(4, 10), table(1, 2, 3, 4, 5, 6, 7, 8, 8, 8)))).toEqual({
      t1: ["£30 · picks semi opponent"],
      t3: ["Playoffs"],
      t5: ["Play-in"],
    });
  });
});
