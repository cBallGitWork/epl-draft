import { describe, expect, it } from "vitest";
import { matchupTabs, matchupView } from "./views";

describe("matchupView", () => {
  it("reads a named view and opens on lineups for anything else", () => {
    expect(matchupView("stats")).toBe("stats");
    expect(matchupView(undefined)).toBe("lineups");
    expect(matchupView("nonsense")).toBe("lineups");
  });
});

describe("matchupTabs", () => {
  it("keeps the round in every link and leaves the opening view out of the query", () => {
    const hrefs = matchupTabs("abc", 5).map((tab) => tab.href);
    expect(hrefs[0]).toBe("/league/matchups/abc?gw=5");
    expect(hrefs[1]).toBe("/league/matchups/abc?gw=5&view=stats");
  });

  it("names no round when the URL named none", () => {
    expect(matchupTabs("abc", undefined)[2]?.href).toBe("/league/matchups/abc?view=players");
  });
});
