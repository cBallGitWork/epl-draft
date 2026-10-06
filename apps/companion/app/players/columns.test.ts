import { describe, expect, it } from "vitest";
import { ATTRIBUTE_ROWS } from "@epl/core";
import { COLUMNS, DEFAULT_SORT, columnFor } from "./columns";
import { attributeStats } from "./attributeColumns";
import { columnsIn } from "./groups";
import { figureOf } from "./figure";

describe("COLUMNS", () => {
  it("gives every column a unique key", () => {
    // `columnFor` returns the FIRST match, so a duplicate key is a sort that
    // silently orders by the wrong column and a head that marks the wrong plate.
    // The raw counts derive their keys from Fantrax's abbreviations by lowering
    // and stripping, so `FP/G` and `FPG` would collide without anyone noticing.
    const keys = COLUMNS.map((column) => column.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("keeps a key the address bar can carry", () => {
    for (const key of COLUMNS.map((column) => column.key)) {
      expect(key, key).toMatch(/^[a-z0-9]+$/);
    }
  });

  it("runs phone-first, so the figures a thumb sees first are the ones worth seeing", () => {
    // Craig, 24 Sep 2026: seven figures fit beside a name at 390, and these are the seven.
    expect(COLUMNS.filter((column) => column.group !== "attributes").map((column) => column.label)).toEqual([
      "Player", "FPts", "FP/G", "Min", "GP", "G", "AT", "A", "AF", "CS", "DFP", "DFP3", "GAO", "GA", "Sv", "GKP", "PKS", "YC", "RC", "PKM", "OG", "Ros", "+/-",
    ]);
  });

  it("has no opponent column", () => {
    // Craig, 24 Sep 2026: "Remove opponent as well". The next fixture is the planner's question.
    expect(columnFor("opp")).toBeUndefined();
  });

  it("resolves the default sort to a real column", () => {
    // Named rather than taken as `COLUMNS[0]`, so this is the assertion that
    // reordering the table cannot silently change what it sorts by.
    expect(columnFor(DEFAULT_SORT)?.key).toBe(DEFAULT_SORT);
  });

  it("has no column that stands down under a thumb", () => {
    // `deskOnly` was deleted on 10 Sep 2026 with `rank`, its last user. This is
    // the assertion that keeps the removal honest rather than a comment: if a
    // column earns the flag back, the plumbing in `PlayerTable` and `Cell` has
    // to come back with it, and this fails first.
    expect(COLUMNS.every((column) => !("deskOnly" in column))).toBe(true);
  });

  it("reads a raw count out of the grouped payload and dashes an absent one", () => {
    const goals = columnFor("g");
    expect(goals).toBeDefined();
    expect(goals!.value({} as never, { G: 3 })).toBe(3);
    // A keeper has no `GAO` and an outfielder no `Sv`: the key is missing rather
    // than nought, and the cell must get null rather than 0.
    expect(goals!.value({} as never, {})).toBeNull();
    expect(goals!.value({} as never, undefined)).toBeNull();
  });
});

describe("the columns a league scores", () => {
  // Each league's getPlayerStats columns on 1 Oct 2026, both halves together.
  const real = new Set(["GP", "Min", "G", "AT", "YC", "RC", "Pen", "DFP", "DFP3", "PKM", "OG", "GAO", "CS", "GA", "PKS", "GKP"]);
  const rehearsal = new Set(["GP", "Min", "G", "A", "AF", "YC", "RC", "DFP", "PKM", "OG", "GAO", "CS", "GA", "Sv", "PKS"]);
  const counts = (scored: ReadonlySet<string>) => columnsIn("all", "fpts", scored).filter((column) => column.stat !== undefined).map((column) => column.label);

  it("draws the real league's AT, GKP and both DefCon counts, and not the A, AF and Sv it no longer scores", () => {
    expect(counts(real)).toEqual(["Min", "GP", "G", "AT", "CS", "DFP", "DFP3", "GAO", "GA", "GKP", "PKS", "YC", "RC", "PKM", "OG"]);
  });

  it("draws the rehearsal league's, with the one DefCon count it scores", () => {
    expect(counts(rehearsal)).toEqual(["Min", "GP", "G", "A", "AF", "CS", "DFP", "GAO", "GA", "Sv", "PKS", "YC", "RC", "PKM", "OG"]);
  });

  // Craig, 6 Oct 2026: "data page needs our dfp and dfp3 stats".
  it("reads both DefCon counts off the grouped payload under Fantrax's codes, under the Defensive plate, per 90 on the toggle", () => {
    const [dfp, dfp3] = [columnFor("dfp"), columnFor("dfp3")];
    const gross = { Min: 450, DFP: 10, DFP3: 24 };
    expect([dfp?.value({} as never, gross), dfp3?.value({} as never, gross)]).toEqual([10, 24]);
    expect([dfp?.stat, dfp3?.stat]).toEqual(["DFP", "DFP3"]);
    expect(dfp && figureOf(dfp, {} as never, gross, true)).toBe(2);
    expect(columnsIn("defensive", "fpts", real).map((column) => column.key)).toEqual(expect.arrayContaining(["dfp", "dfp3"]));
    // A keeper's half carries no DefCon: an absence, never a nought.
    expect(dfp3?.value({} as never, { Min: 450, GA: 4 })).toBeNull();
  });

  it("keeps a column the board is sorted by, even where the league does not score it", () => {
    expect(columnsIn("all", "a", real).some((column) => column.key === "a")).toBe(true);
  });
});

describe("the attribute columns", () => {
  const attributeColumns = COLUMNS.filter((column) => column.group === "attributes");

  it("gives every row of the grid a column under CM's own three-letter heading", () => {
    expect(attributeColumns).toHaveLength(ATTRIBUTE_ROWS.length);
    expect(attributeColumns.every((column) => column.label.length <= 3)).toBe(true);
  });

  it("reads his rating out of the bag, and dashes a man with none", () => {
    const finishing = columnFor("fin");
    expect(finishing?.value({} as never, attributeStats([{ name: "Finishing", rating: 20, from: "" }]))).toBe(20);
    expect(finishing?.value({} as never, {})).toBeNull();
  });

  it("stays off All and fills its own plate, the spine and the sort beside it", () => {
    expect(columnsIn("all", "fpts", new Set()).some((column) => column.group === "attributes")).toBe(false);
    const plate = columnsIn("attributes", "fpts", new Set()).map((column) => column.key);
    expect(plate).toEqual(["name", "fpts", ...attributeColumns.map((column) => column.key)]);
    expect(columnsIn("all", "fin", new Set()).some((column) => column.key === "fin")).toBe(true);
  });

  it("leads with the attribute it is sorted by, so a phone sees the order it is in", () => {
    // Sorted by Work Rate, the 25th column: a 390 phone shows seven, and they were Acc to Dri.
    const plate = columnsIn("attributes", "wor", new Set()).map((column) => column.key);
    expect(plate.slice(0, 2)).toEqual(["name", "wor"]);
    expect(plate.filter((key) => key === "wor")).toHaveLength(1);
  });
});
