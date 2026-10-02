import { describe, expect, it } from "vitest";
import { fixed, PLACES } from "./format";

describe("fixed", () => {
  it("prints a column of points per game at one precision", () => {
    // /players printed 4, 3.75 and 3.8 in one FP/G column.
    expect([4, 3.75, 3.8].map((value) => fixed(value, "perGame"))).toEqual(["4.00", "3.75", "3.80"]);
  });

  it("prints expected goals to two places, a whole one included", () => {
    expect(fixed(2, "expected")).toBe("2.00");
    expect(fixed(0.416, "expected")).toBe("0.42");
  });

  it("prints a rating and a projection to one place", () => {
    expect(fixed(7, "rating")).toBe("7.0");
    expect(fixed(6.45, "projected")).toBe("6.5");
  });

  it("prints a count whole, the British way", () => {
    expect(fixed(1234, "count")).toBe("1,234");
  });

  it("keeps a negative's sign", () => {
    expect(fixed(-0.5, "expected")).toBe("-0.50");
  });

  it("names every kind's places", () => {
    expect(PLACES).toEqual({ count: 0, expected: 2, perGame: 2, perNinety: 2, rating: 1, projected: 1 });
  });
});
