import { describe, expect, it } from "vitest";
import { STAT_COLUMNS, type Bridge, type StatSheet } from "@epl/core";
import { buildStats } from "./build";
import { FANTRAX_STAT, IGNORED } from "./columns";

const SEASON = { code: "SEASON_926_YEAR_TO_DATE", name: "2026-27 - YTD", projected: false };
const col = (stat: string, short: string) => ({ stat, short, name: short });

const OUTFIELD: StatSheet = {
  season: SEASON,
  columns: [col("6120", "Min"), col("6256", "TkW"), col("600n", "OUTP"), col("9999", "NEW")],
  lines: [
    { fantraxId: "04fk1", values: [450, 5, 10.5, 1] },
    { fantraxId: "bench", values: [0, 0, 0, 0] },
    { fantraxId: "academy", values: [90, 1, 0, 0] },
    { fantraxId: "nobody", values: [0, 0, 0, 0] },
  ],
};
const KEEPERS: StatSheet = {
  season: SEASON,
  columns: [col("6120", "Min"), col("6200", "Sv")],
  lines: [{ fantraxId: "keeper", values: [450, 12] }],
};
const BRIDGE: Bridge = {
  "04fk1": { fplCode: 60307, matchedBy: "exact", confidence: 100 },
  bench: { fplCode: 2, matchedBy: "exact", confidence: 100 },
  keeper: { fplCode: 3, matchedBy: "exact", confidence: 100 },
  academy: { status: "unmapped", unmappedBy: "no-fpl-match" },
};

describe("buildStats", () => {
  const built = buildStats([OUTFIELD, KEEPERS], BRIDGE);

  it("keys each man who has played on his FPL code, in the vocabulary's column order", () => {
    expect(built.stats.columns).toEqual(["minutes", "tacklesWon", "saves"]);
    expect(built.stats.players).toEqual([
      { code: 3, values: [450, null, 12] },
      { code: 60307, values: [450, 5, null] },
    ]);
  });

  it("counts the men the bridge cannot key, and those of them who have played", () => {
    expect(built.stats.unbridged).toBe(2);
    expect(built.stats.unbridgedWithMinutes).toBe(1);
  });

  it("names a column the league gained and the keys no sheet carried", () => {
    expect(built.unknown).toEqual(["9999"]);
    expect(built.missing).toContain("keyPasses");
    expect(built.missing).not.toContain("saves");
  });
});

describe("the column map", () => {
  it("never maps the league's own points or a rate", () => {
    for (const stat of IGNORED) expect(FANTRAX_STAT[stat]).toBeUndefined();
  });

  it("fills every key in the vocabulary exactly once", () => {
    const keys = Object.values(FANTRAX_STAT);
    expect(new Set(keys).size).toBe(keys.length);
    expect([...keys].sort()).toEqual(STAT_COLUMNS.map((column) => column.key).sort());
  });
});
