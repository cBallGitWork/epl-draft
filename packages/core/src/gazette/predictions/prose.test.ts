import { describe, expect, it } from "vitest";
import { masked, ngrams, numbersIn, sentences, wordCount } from "./prose";

describe("prose", () => {
  it("splits sentences without breaking a decimal or an initial", () => {
    expect(sentences("B.Fernandes has 4.5 of them. Is that enough? No.")).toEqual(["B.Fernandes has 4.5 of them.", "Is that enough?", "No."]);
    expect(wordCount("Borussia Teeth, by the skin of them.")).toBe(7);
  });

  it("reads digits and number words as figures, and leaves the idiom alone", () => {
    expect(numbersIn("8,000 predictions over twenty-two years, one at a time, second to none")).toEqual([8000, 22]);
    expect(numbersIn("Nought from two, and 3rd in the table with fifty-one points").sort((a, b) => a - b)).toEqual([0, 2, 3, 51]);
  });

  it("blanks names before it counts phrases", () => {
    expect(masked("Hammer Time hammer", ["Hammer Time"])).toBe("\u0000 hammer");
    const grams = ngrams("Rovers Return have three Brentford men today", 3, ["Rovers Return"]);
    expect(grams.has("have three brentford")).toBe(true);
    expect([...grams].some((gram) => gram.includes("return"))).toBe(false);
  });
});
