import { describe, expect, it } from "vitest";
import { capital, fixed, howMany, initialled, PLACES, rounded, spelled, withoutAccents } from "./format";

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

describe("rounded", () => {
  it("holds a figure to its places, a half rounding up", () => {
    expect(rounded(7.25, 1)).toBe(7.3);
    expect(rounded(0.1 + 0.2, 2)).toBe(0.3);
    expect(rounded(4.42499, 2)).toBe(4.42);
    expect(rounded(1234.5, 0)).toBe(1235);
  });
});

describe("initialled", () => {
  it("puts a forename as an initial before the surname", () => {
    expect(initialled("Kiernan Dewsbury-Hall")).toBe("K. Dewsbury-Hall");
    expect(initialled("Virgil van Dijk")).toBe("V. van Dijk");
    expect(initialled("Senne Lammens")).toBe("S. Lammens");
  });

  it("reads Fantrax's surname-first form", () => {
    expect(initialled("Gross, Pascal")).toBe("P. Gross");
    expect(initialled("De Cuyper, Maxim")).toBe("M. De Cuyper");
    expect(initialled("Rodri, ")).toBe("Rodri");
  });

  it("leaves a name that is already short", () => {
    expect(initialled("Rodri")).toBe("Rodri");
    expect(initialled("B.Fernandes")).toBe("B. Fernandes");
    expect(initialled("Bruno G.")).toBe("Bruno G.");
    expect(initialled("Matheus N.")).toBe("Matheus N.");
  });

  it("keeps an accented initial whole", () => {
    expect(initialled("Łukasz Fabiański")).toBe("Ł. Fabiański");
  });
});

describe("howMany", () => {
  it("counts a noun, one alone and the rest plural", () => {
    expect([0, 1, 6].map((n) => howMany(n, "point"))).toEqual(["0 points", "1 point", "6 points"]);
    expect(howMany(2, "match", "matches")).toBe("2 matches");
  });
});

describe("capital", () => {
  it("raises the first letter and leaves the rest", () => {
    expect(capital("two changes")).toBe("Two changes");
    expect(capital("van Hecke")).toBe("Van Hecke");
    expect(capital("")).toBe("");
  });
});

describe("withoutAccents", () => {
  it("takes the accents off and leaves every letter", () => {
    expect(withoutAccents("Sávio")).toBe("Savio");
    expect(withoutAccents("Yéremy Pino")).toBe("Yeremy Pino");
    expect(withoutAccents("Ødegaard")).toBe("Ødegaard");
  });
});

describe("spelled", () => {
  it("spells a count the way a limit is written out", () => {
    expect([0, 6, 10, 13, 20, 35, 120, 130, 200, 999].map(spelled)).toEqual([
      "nought", "six", "ten", "thirteen", "twenty", "thirty-five", "a hundred and twenty", "a hundred and thirty", "two hundred",
      "nine hundred and ninety-nine",
    ]);
  });

  it("leaves a figure it cannot spell as a figure", () => {
    expect([1000, -1, 2.5].map(spelled)).toEqual(["1000", "-1", "2.5"]);
  });
});
