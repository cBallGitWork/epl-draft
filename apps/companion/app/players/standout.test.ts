import { describe, expect, it } from "vitest";
import { cutsFor, per90 } from "./standout";

describe("cutsFor", () => {
  it("files one cut per column and asks each for its own figures", () => {
    const columns = [{ key: "g" }, { key: "gp" }];
    const cuts = cutsFor(columns, (column) =>
      column.key === "g"
        ? [...Array.from({ length: 8 }, () => 3), ...Array.from({ length: 52 }, () => 1)]
        : Array.from({ length: 60 }, () => 3),
    );
    expect(cuts.get("g")).toEqual({ good: 3, best: null });
    // Present and dark, not absent: a column that lights nothing is an answer.
    expect(cuts.get("gp")).toEqual({ good: null, best: null });
  });
});

describe("per90", () => {
  it("rates a count against the minutes behind it", () => {
    expect(per90(3, 270)).toBe(1);
  });

  it("refuses a man with no minutes rather than dividing by nought", () => {
    expect(per90(1, 0)).toBeNull();
    expect(per90(1, null)).toBeNull();
  });

  it("refuses a man who has not played a match, rather than rating him 90 a game", () => {
    // The wall this floor exists to stop: one minute and one point read as 90.00
    // per 90 and sorted to the top of the board.
    expect(per90(1, 1)).toBeNull();
    expect(per90(1, 89)).toBeNull();
  });

  it("rates a man who has played exactly a match", () => {
    expect(per90(1, 90)).toBe(1);
  });

  it("keeps full precision so two close rates still sort", () => {
    // Both print 0.51 and must not be made equal before they are compared.
    const a = per90(2, 350);
    const b = per90(2, 354);
    expect(a).not.toBe(b);
    expect(a?.toFixed(2)).toBe(b?.toFixed(2));
  });
});
