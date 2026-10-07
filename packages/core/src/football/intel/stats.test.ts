import { describe, expect, it } from "vitest";
import { STAT_COLUMNS } from "./statKeys";
import { columnDrift, per90, stat, statIntel, type IntelStats } from "./stats";

const FILE: IntelStats = {
  manifest: { season: "26-27", gameweek: null, exportedAt: "2026-09-26T19:00:00Z", rows: 2, sources: [] },
  season: "2026-27 - YTD",
  columns: ["minutes", "tacklesWon", "retired", "keyPasses"],
  players: [
    { code: 60307, values: [450, 5, 9, 15] },
    { code: 1, values: [0, 0, 0, null] },
  ],
  unbridged: 0,
  unbridgedWithMinutes: 0,
};

describe("statIntel", () => {
  it("keys each man's counts on his FPL code, and drops a column it does not know", () => {
    const row = statIntel(FILE).get(60307);
    expect(row).toEqual({ minutes: 450, tacklesWon: 5, keyPasses: 15 });
  });

  it("is empty with no file", () => {
    expect(statIntel(null).size).toBe(0);
  });
});

describe("stat and per90", () => {
  const rows = statIntel(FILE);

  it("reads a count, and null for a man we hold nothing on", () => {
    expect(stat(rows.get(60307), "tacklesWon")).toBe(5);
    expect(stat(rows.get(999), "tacklesWon")).toBeNull();
  });

  it("takes a count per ninety over his minutes", () => {
    expect(per90(rows.get(60307), "keyPasses")).toBe(3);
  });

  it("refuses a rate of a denominator, or over no minutes", () => {
    expect(per90(rows.get(60307), "minutes")).toBeNull();
    expect(per90(rows.get(1), "tacklesWon")).toBeNull();
  });
});

describe("columnDrift", () => {
  it("names the keys added and removed", () => {
    expect(columnDrift(["minutes", "saves"], ["minutes", "aerialsWon"])).toEqual({ added: ["aerialsWon"], removed: ["saves"] });
  });
});

describe("STAT_COLUMNS", () => {
  it("names each key once", () => {
    expect(new Set(STAT_COLUMNS.map((column) => column.key)).size).toBe(STAT_COLUMNS.length);
  });
});
