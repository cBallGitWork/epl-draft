import { describe, expect, it } from "vitest";
import { rankBy } from "./categoryBoard";
import type { CategoryLine } from "./fantrax/seasonStats";

const GOALS = { key: "Goals", label: "Goals" };
const AGAINST = { key: "Goals Against", label: "Goals against", lowIsGood: true };

const line = (teamId: string, points: number | null, value: number | null): CategoryLine => ({
  teamId,
  points,
  value,
});

describe("rankBy", () => {
  it("ranks by fantasy points, best first", () => {
    const board = rankBy([line("a", 10, 2), line("b", 30, 1), line("c", 20, 5)], GOALS, "points");
    expect(board.map((row) => row.teamId)).toEqual(["b", "c", "a"]);
    expect(board.map((row) => row.rank)).toEqual([1, 2, 3]);
  });

  it("ranks by the raw figure when asked", () => {
    const board = rankBy([line("a", 10, 2), line("b", 30, 1), line("c", 20, 5)], GOALS, "value");
    expect(board.map((row) => row.teamId)).toEqual(["c", "a", "b"]);
  });

  it("puts the smallest figure first in a category where low is good", () => {
    const board = rankBy([line("a", 4, 9), line("b", 9, 2)], AGAINST, "value");
    expect(board.map((row) => row.teamId)).toEqual(["b", "a"]);
  });

  it("still ranks POINTS high-to-low in a low-is-good category", () => {
    // The figure is better when low; the points Fantrax pays for it are already
    // signed, so a side conceding least holds the most points.
    const board = rankBy([line("a", 4, 9), line("b", 9, 2)], AGAINST, "points");
    expect(board.map((row) => row.teamId)).toEqual(["b", "a"]);
  });

  it("shares a rank on a tie and skips the next", () => {
    const board = rankBy(
      [line("a", 5, 1), line("b", 5, 1), line("c", 1, 1)],
      GOALS,
      "points",
    );
    expect(board.map((row) => row.rank)).toEqual([1, 1, 3]);
  });

  it("sorts absence last rather than as nought", () => {
    const board = rankBy([line("a", null, null), line("b", 2, 1)], GOALS, "points");
    expect(board[0]?.teamId).toBe("b");
    expect(board[1]?.points).toBeNull();
  });

  it("sorts absence last in a low-is-good category too", () => {
    // The trap: nought would be the best possible reading, so a team we know
    // nothing about would top the board.
    const board = rankBy([line("a", null, null), line("b", 9, 2)], AGAINST, "value");
    expect(board[0]?.teamId).toBe("b");
  });
});
