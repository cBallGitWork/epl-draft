import { describe, expect, it } from "vitest";
import { fplLineup } from "./lineup";
import { isFplKeeper } from "./types";
import type { FplPick, FplSquad } from "./types";

const pick = (fill: Partial<FplPick> & { slot: number; line: number }): FplPick => ({
  code: fill.slot * 100,
  multiplier: fill.slot <= 11 ? 1 : 0,
  isCaptain: false,
  isViceCaptain: false,
  points: 0,
  ...fill,
});

/** A 4-4-2, in the slot order FPL sends: keeper, then out, then the bench. */
const squad = (picks: FplPick[]): FplSquad => ({ gameweek: 1, picks, total: null, hit: null });

const FOUR_FOUR_TWO = squad([
  pick({ slot: 1, line: 1 }),
  ...[2, 3, 4, 5].map((slot) => pick({ slot, line: 2 })),
  ...[6, 7, 8, 9].map((slot) => pick({ slot, line: 3 })),
  ...[10, 11].map((slot) => pick({ slot, line: 4 })),
  pick({ slot: 12, line: 1 }),
  pick({ slot: 13, line: 3 }),
  pick({ slot: 14, line: 2 }),
  pick({ slot: 15, line: 4 }),
]);

describe("fplLineup", () => {
  it("puts the XI in lines back to front, which is how a formation is read", () => {
    const { rows } = fplLineup(FOUR_FOUR_TWO);
    expect(rows.map((row) => `${row.label}:${row.players.length}`)).toEqual([
      "GK:1",
      "DEF:4",
      "MID:4",
      "FWD:2",
    ]);
  });

  it("keeps the bench in the order they would come on, which is all that order means", () => {
    expect(fplLineup(FOUR_FOUR_TWO).bench.map((p) => p.slot)).toEqual([12, 13, 14, 15]);
  });

  it("takes the XI from FPL's slot numbers, never from the multiplier", () => {
    // A benched player has multiplier 0 and so does a starter who blanked under
    // a chip nobody played; slots 1-11 are the only thing that says who started.
    const { rows, bench } = fplLineup(FOUR_FOUR_TWO);
    expect(rows.flatMap((row) => row.players).length).toBe(11);
    expect(bench.length).toBe(4);
  });

  it("drops a line nobody is in rather than drawing a blank stripe", () => {
    // Three at the back and no forwards is a real FPL side.
    const noForwards = squad([
      pick({ slot: 1, line: 1 }),
      ...[2, 3, 4].map((slot) => pick({ slot, line: 2 })),
      ...[5, 6, 7, 8, 9, 10, 11].map((slot) => pick({ slot, line: 3 })),
    ]);
    expect(fplLineup(noForwards).rows.map((row) => row.label)).toEqual(["GK", "DEF", "MID"]);
  });

  it("stands a pick FPL gave no line to at the top rather than dropping him", () => {
    // `line` is 0 when the payload omitted `element_type`. Losing a man from a
    // fifteen is a worse answer than standing him in a row of his own, and the
    // raw number is the label on the same rule the rest of the app follows for a
    // vocabulary it has not seen.
    const unlined = squad([pick({ slot: 1, line: 0 }), pick({ slot: 2, line: 2 })]);
    const { rows } = fplLineup(unlined);
    expect(rows.map((row) => row.label)).toEqual(["0", "DEF"]);
    expect(rows.flatMap((row) => row.players).length).toBe(2);
  });
});

describe("isFplKeeper", () => {
  it("knows FPL's keeper from FPL's own numbering", () => {
    expect(isFplKeeper(1)).toBe(true);
    expect([2, 3, 4].map(isFplKeeper)).toEqual([false, false, false]);
  });

  it("says no for a line FPL did not give", () => {
    // Zero is what `mapSquad` writes when the payload omits `element_type`.
    // Drawing him a keeper's shirt on that would be a guess.
    expect(isFplKeeper(0)).toBe(false);
  });
});
