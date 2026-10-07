import { describe, expect, it } from "vitest";
import { bothSides } from "./relevance";

describe("bothSides", () => {
  it("needs a man on each side of the pairing, not two on one", () => {
    expect(bothSides({ homeTeamId: "a", awayTeamId: "b", homeMen: 1, awayMen: 2 })).toBe(true);
    expect(bothSides({ homeTeamId: "a", awayTeamId: "b", homeMen: 0, awayMen: 2 })).toBe(false);
    expect(bothSides({ homeTeamId: "a", awayTeamId: "b", homeMen: 2, awayMen: 0 })).toBe(false);
  });
});
