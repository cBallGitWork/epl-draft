import { describe, expect, it } from "vitest";
import { careerIntel, seasonKey } from "./careers";

const manifest = { season: "26-27", gameweek: null, exportedAt: "2026-09-25T09:00:00Z", rows: 1, sources: [] };

describe("careerIntel", () => {
  it("files each man's clubs by season", () => {
    const careers = careerIntel({
      manifest,
      players: [{ code: 441264, seasons: [{ season: "26-27", club: "Sunderland" }, { season: "25-26", club: "Sunderland" }] }],
    });
    expect(careers.get(441264)?.get("25-26")).toBe("Sunderland");
  });

  it("drops a row it cannot key rather than guessing", () => {
    const careers = careerIntel({
      manifest,
      players: [
        { code: Number.NaN, seasons: [{ season: "25-26", club: "Sunderland" }] },
        { code: 1, seasons: [{ season: "25-26", club: "" }] },
      ],
    });
    expect(careers.has(Number.NaN)).toBe(false);
    expect(careers.get(1)?.size).toBe(0);
    expect(careerIntel(null).size).toBe(0);
  });
});

describe("seasonKey", () => {
  it("reads FPL's label and Fantrax's alike", () => {
    expect(seasonKey("2025/26")).toBe("25-26");
    expect(seasonKey("2026-27")).toBe("26-27");
    expect(seasonKey("This season")).toBeNull();
  });
});
