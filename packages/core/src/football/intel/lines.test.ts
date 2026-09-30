import { describe, expect, it } from "vitest";
import { lineIntel, playedFloor } from "./lines";

const manifest = { season: "25-26", gameweek: null, exportedAt: "2026-09-30T12:00:00Z", rows: 1, sources: [] };

describe("lineIntel", () => {
  it("files each man's season by code", () => {
    const lines = lineIntel({
      manifest,
      players: [{ code: 223094, minutes: 2953, starts: 34, fplMinutes: 2800, xgot: 23.4, ratings: [8.1, 7.2], running: null }],
    });
    expect(lines.get(223094)).toMatchObject({ minutes: 2953, starts: 34, xgot: 23.4, ratings: [8.1, 7.2], running: null });
  });

  it("reads a count it was not given as null, never nought", () => {
    const line = lineIntel({ manifest, players: [{ code: 1, minutes: 900, fouls: "3" }] }).get(1);
    expect(line?.fouls).toBeNull();
    expect(line?.tackles).toBeNull();
  });

  it("keeps running only when it is whole", () => {
    const lines = lineIntel({
      manifest,
      players: [
        { code: 1, minutes: 450, running: { minutes: 450, km: 49, sprints: 90, topSpeed: 34.7 } },
        { code: 2, minutes: 450, running: { minutes: 450, km: 49 } },
      ],
    });
    expect(lines.get(1)?.running).toEqual({ minutes: 450, km: 49, sprints: 90, topSpeed: 34.7 });
    expect(lines.get(2)?.running).toBeNull();
  });

  it("drops a row it cannot key rather than guessing", () => {
    const lines = lineIntel({ manifest, players: [{ code: 1.5, minutes: 90 }, { minutes: 90 }, null] });
    expect(lines.size).toBe(0);
    expect(lineIntel(null).size).toBe(0);
  });
});

describe("playedFloor", () => {
  it("is a third of the most minutes anyone played", () => {
    const lines = lineIntel({ manifest, players: [{ code: 1, minutes: 3420 }, { code: 2, minutes: 90 }] });
    expect(playedFloor(lines.values())).toBe(1140);
  });
});
