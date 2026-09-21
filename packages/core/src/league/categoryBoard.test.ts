import { describe, expect, it } from "vitest";
import { rankBy } from "./categoryBoard";
import type { CategoryLine } from "./fantrax/seasonStats";
import type { StatCategory } from "./categories";

const GOALS = { key: "Goals", group: "attacking", label: "Goals", short: "G" } as const;
const ASSISTS = {
  key: "Assists (Official)",
  group: "attacking",
  label: "Assists",
  short: "A",
} as const;
const AGAINST = {
  key: "Goals Against",
  group: "defensive",
  label: "Goals against",
  short: "GA",
  lowIsGood: true,
} as const;

const line = (teamId: string, points: number | null, value: number | null): CategoryLine => ({
  teamId,
  points,
  value,
});

/** One category's lines, in the shape the page hands over. */
const only = (
  category: StatCategory,
  ...lines: CategoryLine[]
): ReadonlyMap<string, readonly CategoryLine[]> => new Map([[category.key, lines]]);

describe("rankBy", () => {
  it("ranks by fantasy points, best first", () => {
    const board = rankBy(
      [GOALS],
      only(GOALS, line("a", 10, 2), line("b", 30, 1), line("c", 20, 5)),
      GOALS,
      "points",
    );
    expect(board.map((row) => row.teamId)).toEqual(["b", "c", "a"]);
    expect(board.map((row) => row.rank)).toEqual([1, 2, 3]);
  });

  it("ranks by the raw figure when asked", () => {
    const board = rankBy(
      [GOALS],
      only(GOALS, line("a", 10, 2), line("b", 30, 1), line("c", 20, 5)),
      GOALS,
      "value",
    );
    expect(board.map((row) => row.teamId)).toEqual(["c", "a", "b"]);
  });

  it("puts the smallest figure first in a category where low is good", () => {
    const board = rankBy([AGAINST], only(AGAINST, line("a", 4, 9), line("b", 9, 2)), AGAINST, "value");
    expect(board.map((row) => row.teamId)).toEqual(["b", "a"]);
  });

  it("still ranks POINTS high-to-low in a low-is-good category", () => {
    // The figure is better when low; the points Fantrax pays for it are already
    // signed, so a side conceding least holds the most points.
    const board = rankBy([AGAINST], only(AGAINST, line("a", 4, 9), line("b", 9, 2)), AGAINST, "points");
    expect(board.map((row) => row.teamId)).toEqual(["b", "a"]);
  });

  it("shares a rank on a tie and skips the next", () => {
    const board = rankBy(
      [GOALS],
      only(GOALS, line("a", 5, 1), line("b", 5, 1), line("c", 1, 1)),
      GOALS,
      "points",
    );
    expect(board.map((row) => row.rank)).toEqual([1, 1, 3]);
  });

  it("sorts absence last rather than as nought", () => {
    const board = rankBy([GOALS], only(GOALS, line("a", null, null), line("b", 2, 1)), GOALS, "points");
    expect(board[0]?.teamId).toBe("b");
    expect(board[1]?.figures[0]).toBeNull();
  });

  it("sorts absence last in a low-is-good category too", () => {
    // The trap: nought would be the best possible reading, so a team we know
    // nothing about would top the board.
    const board = rankBy([AGAINST], only(AGAINST, line("a", null, null), line("b", 9, 2)), AGAINST, "value");
    expect(board[0]?.teamId).toBe("b");
  });

  it("carries every category in the group, in the order handed in", () => {
    const lines = new Map([
      [GOALS.key, [line("a", 10, 2), line("b", 30, 6)]],
      [ASSISTS.key, [line("a", 9, 3), line("b", 3, 1)]],
    ]);
    const board = rankBy([GOALS, ASSISTS], lines, GOALS, "value");
    expect(board.map((row) => [row.teamId, ...row.figures])).toEqual([
      ["b", 6, 1],
      ["a", 2, 3],
    ]);
  });

  it("orders by the category asked for, not by the first column", () => {
    const lines = new Map([
      [GOALS.key, [line("a", 10, 2), line("b", 30, 6)]],
      [ASSISTS.key, [line("a", 9, 3), line("b", 3, 1)]],
    ]);
    const board = rankBy([GOALS, ASSISTS], lines, ASSISTS, "value");
    expect(board.map((row) => row.teamId)).toEqual(["a", "b"]);
  });

  it("gives a team missing from one category a hole rather than a nought", () => {
    // Fantrax publishes a category's table without the sides that registered
    // nothing in it. A blank cell is what that is; `0` would be a claim.
    const lines = new Map([
      [GOALS.key, [line("a", 10, 2), line("b", 30, 6)]],
      [ASSISTS.key, [line("a", 9, 3)]],
    ]);
    const board = rankBy([GOALS, ASSISTS], lines, GOALS, "value");
    expect(board.map((row) => row.figures)).toEqual([
      [6, null],
      [2, 3],
    ]);
  });

  it("draws a team that appears only in a later category", () => {
    const lines = new Map([
      [GOALS.key, [line("a", 10, 2)]],
      [ASSISTS.key, [line("b", 9, 3)]],
    ]);
    const board = rankBy([GOALS, ASSISTS], lines, GOALS, "value");
    expect(board.map((row) => [row.teamId, ...row.figures])).toEqual([
      ["a", 2, null],
      ["b", null, 3],
    ]);
  });

  it("is empty when Fantrax published nothing for the group", () => {
    expect(rankBy([GOALS, ASSISTS], new Map(), GOALS, "points")).toEqual([]);
  });
});
