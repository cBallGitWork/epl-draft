import { describe, expect, it } from "vitest";
import { INTEL_SEASON, intelManifest, sameApartFromManifest } from "./intel";

// The helpers every intel writer shares: its manifest, and whether a fresh export changed anything.

const SOURCES = [{ path: "somewhere", mtime: null }];

function doc(rows: unknown[], exportedAt: string) {
  return { manifest: intelManifest({ gameweek: null, rows: rows.length, sources: SOURCES }, exportedAt), rows };
}

describe("intelManifest", () => {
  it("stamps this season and the time given, in the files' field order", () => {
    const manifest = intelManifest({ gameweek: 6, rows: 2, sources: SOURCES }, "2026-10-07T12:00:00.000Z");
    expect(Object.keys(manifest)).toEqual(["season", "gameweek", "exportedAt", "rows", "sources"]);
    expect(manifest.season).toBe(INTEL_SEASON);
    expect(manifest.exportedAt).toBe("2026-10-07T12:00:00.000Z");
  });
});

describe("sameApartFromManifest", () => {
  it("ignores a new exportedAt", () => {
    expect(sameApartFromManifest(doc([{ code: 1 }], "2026-10-06T00:00:00Z"), doc([{ code: 1 }], "2026-10-07T00:00:00Z"))).toBe(true);
  });

  it("sees a changed row", () => {
    expect(sameApartFromManifest(doc([{ code: 1 }], "2026-10-07T00:00:00Z"), doc([{ code: 2 }], "2026-10-07T00:00:00Z"))).toBe(false);
  });

  it("reads one value built in two key orders as the same", () => {
    const a = doc([{ code: 1, club: 3 }], "2026-10-07T00:00:00Z");
    const b = doc([{ club: 3, code: 1 }], "2026-10-07T00:00:00Z");
    expect(sameApartFromManifest(a, b)).toBe(true);
  });

  it("keeps row order, which is part of what a file says", () => {
    expect(sameApartFromManifest(doc([1, 2], "x"), doc([2, 1], "x"))).toBe(false);
  });
});
