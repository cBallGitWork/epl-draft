import { describe, expect, it } from "vitest";
import { mapGameLog } from "../gameLog";
import { mapPastSeasons } from "../seasons";
import type { RawElementSummary } from "../fpl/raw";
import saka from "../__fixtures__/elementSummary.json";
import timber from "../__fixtures__/elementSummaryTimber.json";
import { historyOf, slimSummary } from "./history";

const RECORDED = [saka, timber] as unknown as RawElementSummary[];

describe("slimSummary", () => {
  // The fallback is only as good as this: the page must read the same season off the slim copy as off FPL.
  it("gives the mappers exactly what FPL's own answer gives them", () => {
    for (const raw of RECORDED) {
      expect(mapGameLog(slimSummary(raw))).toEqual(mapGameLog(raw));
      expect(mapPastSeasons(slimSummary(raw))).toEqual(mapPastSeasons(raw));
    }
  });

  it("drops what nothing reads: the fixtures to come and untyped fields", () => {
    const slim = slimSummary(timber as unknown as RawElementSummary) as unknown as Record<string, unknown>;
    expect(slim).not.toHaveProperty("fixtures");
    expect(Object.keys((slim.history as object[])[0])).not.toContain("influence");
  });
});

describe("historyOf", () => {
  it("finds a man by FPL code, and nobody it does not hold", () => {
    const manifest = { season: "26-27", gameweek: 5, exportedAt: "2026-09-28T15:40:00Z", rows: 1, sources: [] };
    const file = { manifest, players: { "445122": slimSummary(timber as unknown as RawElementSummary) } };
    expect(historyOf(file, 445122)?.history.length).toBe(5);
    expect(historyOf(file, 1)).toBeNull();
    expect(historyOf(null, 445122)).toBeNull();
  });
});
