import { describe, expect, it } from "vitest";
import { ordinal, printedPlaces } from "./ordinal";

const at = (teamId: string, rank: number) => ({ teamId, rank });

describe("ordinal", () => {
  it("takes th in the teens", () => {
    expect([1, 2, 3, 4, 11, 12, 13, 21, 22, 101].map(ordinal)).toEqual([
      "1st", "2nd", "3rd", "4th", "11th", "12th", "13th", "21st", "22nd", "101st",
    ]);
  });
});

describe("printedPlaces", () => {
  it("prints a place held alone as its ordinal", () => {
    expect(printedPlaces([at("a", 1), at("b", 2), at("c", 3)])).toEqual(new Map([["a", "1st"], ["b", "2nd"], ["c", "3rd"]]));
  });

  it("prints a place two or more teams share with an equals sign, and only that place", () => {
    expect(printedPlaces([at("a", 1), at("b", 1), at("c", 3), at("d", 4), at("e", 4), at("f", 4)])).toEqual(
      new Map([["a", "=1st"], ["b", "=1st"], ["c", "3rd"], ["d", "=4th"], ["e", "=4th"], ["f", "=4th"]]),
    );
  });
});
