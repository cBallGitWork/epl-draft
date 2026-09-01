import { describe, expect, it } from "vitest";
import { rankPlayers } from "./playerBoard";
import type { PlayerStatLine } from "./fantrax/playerStats";

const GOALS = { key: "G", group: "attacking" as const, label: "Goals" };
const CARDS = { key: "YC", group: "discipline" as const, label: "Yellow cards", lowIsGood: true };

const line = (id: string, stats: Record<string, number | null>): PlayerStatLine => ({
  fantraxId: id,
  name: id,
  club: "Arsenal",
  clubShort: "ARS",
  position: "F",
  ownerTeamId: null,
  stats,
});

describe("rankPlayers", () => {
  it("ranks by the raw count, best first", () => {
    const board = rankPlayers([line("a", { G: 3 }), line("b", { G: 9 }), line("c", { G: 5 })], GOALS);
    expect(board.map((row) => row.line.fantraxId)).toEqual(["b", "c", "a"]);
  });

  it("puts the smallest first where low is good", () => {
    const board = rankPlayers([line("a", { YC: 7 }), line("b", { YC: 1 })], CARDS);
    expect(board[0]?.line.fantraxId).toBe("b");
  });

  it("drops a player the read carried no figure for", () => {
    // A keeper has no `GAO` at all, so a third of the pool is legitimately
    // absent from half the categories. Nought would rank them top of every
    // low-is-good board.
    const board = rankPlayers([line("a", { YC: 2 }), line("b", {})], CARDS);
    expect(board).toHaveLength(1);
    expect(board[0]?.line.fantraxId).toBe("a");
  });

  it("shares a rank on a tie and skips the next", () => {
    const board = rankPlayers(
      [line("a", { G: 5 }), line("b", { G: 5 }), line("c", { G: 1 })],
      GOALS,
    );
    expect(board.map((row) => row.rank)).toEqual([1, 1, 3]);
  });

  it("cuts at the limit but keeps the true rank on the last row", () => {
    const many = Array.from({ length: 30 }, (_, at) => line(`p${at}`, { G: 30 - at }));
    const board = rankPlayers(many, GOALS, 5);
    expect(board).toHaveLength(5);
    expect(board[4]?.rank).toBe(5);
  });

  it("survives an empty pool", () => {
    expect(rankPlayers([], GOALS)).toEqual([]);
  });
});
