import { describe, expect, it } from "vitest";
import { fixtureOnly, COLUMNS, DEFAULT_SORT, columnFor } from "./columns";

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

describe("fixtureOnly", () => {
  it("keeps the club and drops Fantrax's kickoff", () => {
    expect(fixtureOnly("MCI Sun 11:30AM")).toBe("MCI");
  });

  it("keeps the away marker, which belongs to the fixture and not the clock", () => {
    expect(fixtureOnly("@CHE Sat 10:00AM")).toBe("@CHE");
  });

  it("passes a cell that is only a fixture through whole", () => {
    // A blank gameweek and a bye both arrive with no time on them.
    expect(fixtureOnly("BYE")).toBe("BYE");
  });

  it("reads an empty cell as an absence rather than an empty fixture", () => {
    expect(fixtureOnly("   ")).toBeNull();
    expect(fixtureOnly(null)).toBeNull();
  });
});
