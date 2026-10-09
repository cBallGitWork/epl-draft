import { describe, expect, it } from "vitest";
import type { PoolRow } from "../pool";
import { candidates, sides, type Sides } from "./pick";

/** Just enough of a pool row for the picker, which reads two fields of it. */
function pool(names: [string, string][]): PoolRow[] {
  return names.map(([fantraxId, displayName]) => ({
    entry: { player: { fantraxId, displayName } },
    stats: null,
    fplCode: null,
  }) as unknown as PoolRow);
}

const ROWS = pool([
  ["1", "Haaland, Erling"],
  ["2", "Palmer, Cole"],
  ["3", "Palmer, Alex"],
  ["4", "Rice, Declan"],
  ["5", "Saka, Bukayo"],
  ["6", "Salah, Mohamed"],
  ["7", "Sakamoto, Tatsuhiro"],
  ["8", "Sancho, Jadon"],
]);

describe("candidates", () => {
  it("offers nothing until something is typed", () => {
    // A list that appears before anybody has asked pushes the two men being
    // compared off a phone.
    expect(candidates(ROWS, "", undefined)).toEqual([]);
    expect(candidates(ROWS, "   ", undefined)).toEqual([]);
  });

  it("matches anywhere in the name, not just the start", () => {
    // Fantrax files a man surname-first, so a reader typing a forename is
    // searching the middle of the string.
    expect(candidates(ROWS, "erling", undefined).map((each) => each.name)).toEqual([
      "Haaland, Erling",
    ]);
  });

  it("ignores case", () => {
    expect(candidates(ROWS, "HAALAND", undefined)).toHaveLength(1);
  });

  it("excludes the man already on the other side", () => {
    // Comparing a player with himself is a screen with nothing to say, and a
    // name you cannot pick should not be in a list of names to pick.
    const found = candidates(ROWS, "palmer", "2").map((each) => each.name);
    expect(found).toEqual(["Palmer, Alex"]);
  });

  it("stops at six so the list clears a phone keyboard", () => {
    const many = pool(Array.from({ length: 20 }, (_, n) => [String(n), `Smith, ${n}`]));
    expect(candidates(many, "smith", undefined)).toHaveLength(6);
  });

  it("keeps the pool's own order rather than ranking", () => {
    // The board matches the same way and in the same order; a picker that
    // ordered its answers differently would be two screens disagreeing about
    // what "sa" means.
    expect(candidates(ROWS, "sa", undefined).map((each) => each.fantraxId)).toEqual([
      "5",
      "6",
      "7",
      "8",
    ]);
  });
});

describe("sides", () => {
  const link = (over: Partial<Sides>): Sides => ({ a: undefined, b: undefined, qa: "", qb: "", ...over });

  it("keeps two different men, and both searches, where the link put them", () => {
    expect(sides(link({ a: "1", b: "2", qa: "sal" }))).toEqual(link({ a: "1", b: "2", qa: "sal" }));
  });

  it("reads a lone man in box B as the one man on screen, not nobody", () => {
    expect(sides(link({ b: "2" }))).toEqual(link({ a: "2" }));
  });

  it("moves the empty box's search with him, so picking from it still compares the two", () => {
    expect(sides(link({ b: "2", qa: "sal" }))).toEqual(link({ a: "2", qb: "sal" }));
  });

  it("never sets a man against himself", () => {
    expect(sides(link({ a: "1", b: "1" }))).toEqual(link({ a: "1" }));
  });

  it("leaves a search where it was typed while nobody is chosen", () => {
    expect(sides(link({ qa: "sal" }))).toEqual(link({ qa: "sal" }));
  });
});
