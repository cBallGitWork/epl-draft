import { describe, expect, it } from "vitest";
import { editorsOrder, normalizeApplied, readMoves } from "./editor";

const order = ["a", "b", "c", "d"].map((teamId) => ({ teamId }));
const move = (teamId: string, place: number) => ({ teamId, place, by: "Craig", on: "2026-10-05", said: "put him 3rd" });

describe("editorsOrder", () => {
  it("puts a side at the editor's place, shifting the sides between, and records where the code had it", () => {
    const { order: printed, applied } = editorsOrder(order, [move("d", 3)]);
    expect(printed.map((each) => each.teamId)).toEqual(["a", "b", "d", "c"]);
    expect(applied).toEqual([{ ...move("d", 3), from: 4 }]);
  });

  it("moves a side down as well as up, and applies moves in turn", () => {
    expect(editorsOrder(order, [move("a", 2), move("d", 1)]).order.map((each) => each.teamId)).toEqual(["d", "b", "a", "c"]);
  });

  it("skips a move naming no side in the order or a place off its end, and records neither", () => {
    const { order: printed, applied } = editorsOrder(order, [move("zz", 2), move("a", 9), move("b", 0)]);
    expect(printed).toEqual(order);
    expect(applied).toEqual([]);
  });
});

describe("readMoves and normalizeApplied", () => {
  it("reads the file's moves field by field and drops the malformed", () => {
    expect(readMoves([move("d", 3), { teamId: "", place: 2 }, { teamId: "c", place: "two" }, null])).toEqual([move("d", 3)]);
    expect(readMoves(undefined)).toEqual([]);
  });

  it("keeps a filed move only with the place the code gave it", () => {
    expect(normalizeApplied([{ ...move("d", 3), from: 4 }, move("c", 2)])).toEqual([{ ...move("d", 3), from: 4 }]);
    expect(normalizeApplied([move("c", 2)])).toBeUndefined();
  });
});
