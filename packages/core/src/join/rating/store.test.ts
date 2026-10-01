import { describe, expect, it } from "vitest";
import { marksOf, readRatingStore } from "./store";

describe("readRatingStore", () => {
  it("reads a man's marks by fixture, keeping a too-brief null and dropping what is not a mark", () => {
    const store = readRatingStore({
      manifest: { season: "26-27", leagueId: "mqs", updatedAt: "2026-10-01T00:00:00Z", days: ["2026-09-20", 7] },
      marks: { "223094": { "2645241": 6.2, "2645250": null, "2645260": "9", "2645270": 14 } },
    });
    expect(store.manifest.days).toEqual(["2026-09-20"]);
    expect([...marksOf(store, 223094)]).toEqual([[2645241, 6.2], [2645250, null], [2645260, null], [2645270, null]]);
  });

  it("reads nothing from nothing", () => {
    const store = readRatingStore(undefined);
    expect(store.manifest.leagueId).toBe("");
    expect(marksOf(store, 1).size).toBe(0);
  });
});
