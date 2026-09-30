import { describe, expect, it } from "vitest";
import { ATTRIBUTE_ROWS } from "@epl/core";
import { COLUMNS, DEFAULT_SORT, columnFor } from "./columns";
import { attributeStats } from "./attributeColumns";
import { columnsIn } from "./groups";

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
      "Player", "FPts", "FP/G", "Min", "GP", "G", "A", "AF", "CS", "GAO", "GA", "Sv", "PKS", "YC", "RC", "PKM", "OG", "Ros", "+/-",
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
    expect(columnsIn("all", "fpts").some((column) => column.group === "attributes")).toBe(false);
    const plate = columnsIn("attributes", "fpts").map((column) => column.key);
    expect(plate).toEqual(["name", "fpts", ...attributeColumns.map((column) => column.key)]);
    expect(columnsIn("all", "fin").some((column) => column.key === "fin")).toBe(true);
  });
});
