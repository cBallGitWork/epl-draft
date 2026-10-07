import { describe, expect, it } from "vitest";
import { hasScore } from "./score";

describe("hasScore", () => {
  it("is true only when FPL has both halves of the score, nil-nil included", () => {
    expect(hasScore({ homeScore: 0, awayScore: 0 })).toBe(true);
    expect(hasScore({ homeScore: 1, awayScore: null })).toBe(false);
    expect(hasScore({ homeScore: null, awayScore: null })).toBe(false);
  });
});
