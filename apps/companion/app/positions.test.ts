import { describe, expect, it } from "vitest";
import { backToFront, positionLabel, positionsFromList, positionsLabel } from "./positions";

describe("position labels", () => {
  it("spells one position the way a manager says it", () => {
    expect(positionLabel("G")).toBe("GK");
    expect(positionsLabel(["M"])).toBe("MID");
  });

  it("leaves the choice of what nothing looks like to the caller", () => {
    expect(positionLabel(null)).toBeNull();
    expect(positionLabel("")).toBeNull();
    expect(positionsLabel([])).toBeNull();
    expect(positionsLabel(positionsFromList(undefined))).toBeNull();
  });

  it("abbreviates two, back to front, whatever order Fantrax sends them in", () => {
    // Saka arrives as "F,M" and is a midfielder who can play up front (Craig, 2 Sep).
    expect(positionsLabel(positionsFromList("F, M"))).toBe("M/F");
    expect(positionsLabel(["F", "D"])).toBe("D/F");
  });

  it("keeps a letter it has never seen, last", () => {
    expect(positionLabel("X")).toBe("X");
    expect(positionsLabel(["X", "M"])).toBe("M/X");
  });
});

describe("backToFront", () => {
  it("puts Fantrax's letters in pitch order, whatever order Fantrax sent them in", () => {
    expect(backToFront(["F", "M"])).toEqual(["M", "F"]);
    expect(backToFront(["M", "", "D"])).toEqual(["D", "M"]);
  });
});
