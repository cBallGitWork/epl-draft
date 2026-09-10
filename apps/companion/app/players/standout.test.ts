import { describe, expect, it } from "vitest";
import { cutFor, cutsFor, isStandout, per90 } from "./standout";

describe("cutFor", () => {
  it("lights the top band of a small-integer column and stops", () => {
    // Goals after three rounds: eight men on 3, twenty on 2, thirty-two on 1.
    // Eight of sixty is inside a sixth; taking the 2s as well would be
    // twenty-eight, which is a band rather than a mark.
    const values = [
      ...Array.from({ length: 8 }, () => 3),
      ...Array.from({ length: 20 }, () => 2),
      ...Array.from({ length: 32 }, () => 1),
    ];
    expect(cutFor(values)).toBe(3);
  });

  it("takes more than one value when both fit", () => {
    // A spread column: the top four figures of sixty are all distinct, so the
    // cut walks down to the fourth rather than stopping at the first.
    const values = [10, 9, 8, 7, ...Array.from({ length: 56 }, () => 1)];
    expect(cutFor(values)).toBe(7);
  });

  it("takes a band whole or not at all", () => {
    // Ten tied at the top of sixty is inside the sixth; the next band down would
    // take it to twenty-five, so that band is refused entire. Lighting ten of
    // the fifteen on 2 would be a distinction no reader could see.
    const values = [
      ...Array.from({ length: 10 }, () => 5),
      ...Array.from({ length: 15 }, () => 2),
      ...Array.from({ length: 35 }, () => 1),
    ];
    expect(cutFor(values)).toBe(5);
  });

  it("leaves a column dark when even its top value is common", () => {
    // `Min` three rounds in: thirty of a hundred have played every minute, and a
    // mark on a third of the column is the ramp arriving by the back door.
    const values = [
      ...Array.from({ length: 30 }, () => 270),
      ...Array.from({ length: 70 }, (_, index) => 100 + index),
    ];
    expect(cutFor(values)).toBeNull();
  });

  it("leaves a column dark when everybody agrees", () => {
    // `GP` after three rounds. The top value is the whole column, so the share
    // test refuses it without needing a guard of its own.
    expect(cutFor(Array.from({ length: 600 }, () => 3))).toBeNull();
  });

  it("lights nothing when a column has fewer than ten figures", () => {
    // The keeper-only columns for most of a season: a handful of men with a
    // penalty save each, where a sixth is one man and means nothing.
    expect(cutFor([1, 1, 1, 2])).toBeNull();
  });

  it("lights nothing when the column is all noughts", () => {
    expect(cutFor(Array.from({ length: 600 }, () => 0))).toBeNull();
  });

  it("ignores the men on nought when sizing the population", () => {
    // The pool's real shape: 490 on nought and a handful of scorers. Counting
    // the noughts would make a sixth of the POOL the room available, and the
    // whole scoring population would fit inside it.
    const values = [
      ...Array.from({ length: 490 }, () => 0),
      ...Array.from({ length: 8 }, () => 3),
      ...Array.from({ length: 52 }, () => 1),
    ];
    expect(cutFor(values)).toBe(3);
  });

  it("passes nulls through as absences rather than noughts", () => {
    // A keeper has no `GAO` and an outfielder no `Sv`: the key is missing rather
    // than nought, and a missing figure must not join the population.
    const values = [
      ...Array.from({ length: 8 }, () => 3),
      ...Array.from({ length: 52 }, () => 1),
      null,
      null,
    ];
    expect(cutFor(values)).toBe(3);
  });
});

describe("isStandout", () => {
  it("lights a figure at the cut and above it", () => {
    expect(isStandout(3, 3)).toBe(true);
    expect(isStandout(4, 3)).toBe(true);
  });

  it("leaves a figure below the cut alone", () => {
    expect(isStandout(2, 3)).toBe(false);
  });

  it("lights nothing when the column has no cut", () => {
    expect(isStandout(999, null)).toBe(false);
  });
});

describe("cutsFor", () => {
  it("files one cut per column and asks each for its own figures", () => {
    const columns = [{ key: "g" }, { key: "gp" }];
    const cuts = cutsFor(columns, (column) =>
      column.key === "g"
        ? [...Array.from({ length: 8 }, () => 3), ...Array.from({ length: 52 }, () => 1)]
        : Array.from({ length: 60 }, () => 3),
    );
    expect(cuts.get("g")).toBe(3);
    // Present and null, not absent: a column that lights nothing is an answer.
    expect(cuts.has("gp")).toBe(true);
    expect(cuts.get("gp")).toBeNull();
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
