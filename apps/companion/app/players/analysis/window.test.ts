import { describe, expect, it } from "vitest";
import { windowWords } from "./window";

describe("windowWords", () => {
  it("says the season when the range is the season", () => {
    expect(windowWords(false, [1, 2, 3])).toBe("this season");
  });

  it("names the first and last gameweek of a recent range", () => {
    expect(windowWords(true, [2, 3, 4, 5, 6, 7])).toBe("gameweeks 2 to 7");
  });

  it("names a one-gameweek range once", () => {
    expect(windowWords(true, [1])).toBe("gameweek 1");
  });

  it("says there are no gameweeks before a match has finished, never undefined", () => {
    expect(windowWords(true, [])).toBe("no gameweeks yet");
  });
});
