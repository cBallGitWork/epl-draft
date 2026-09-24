import { describe, expect, it } from "vitest";
import type { SeasonTotals } from "@epl/core";
import { rateRows, type Played } from "./rates";

/** A season with everything at nought, so each case sets only what it is about.
 *  Every field on `SeasonTotals` is present on all 651 elements, so a plain
 *  object is a truthful stand-in rather than a convenience. */
function season(over: Partial<Played & SeasonTotals> = {}): Played & SeasonTotals {
  return {
    touches: null,
    shots: null,
    keyPasses: null,
    goals: 0,
    assists: 0,
    cleanSheets: 0,
    minutes: 0,
    starts: 0,
    expectedGoals: 0,
    expectedAssists: 0,
    expectedGoalsConceded: 0,
    influence: 0,
    creativity: 0,
    threat: 0,
    tackles: 0,
    clearancesBlocksInterceptions: 0,
    recoveries: 0,
    saves: 0,
    goalsConceded: 0,
    bonus: 0,
    bps: 0,
    ...over,
  };
}

function row(rows: ReturnType<typeof rateRows>, name: string) {
  return rows.find((each) => each.name === name);
}

describe("rateRows", () => {
  it("divides a count by ninety and leaves a denominator alone", () => {
    // 900 minutes is ten matches: four expected goals is 0.4 a game, and the
    // minutes themselves must stay 900 rather than becoming 90.
    const rows = rateRows(season({ minutes: 900, expectedGoals: 4 }), null);
    expect(row(rows, "xG")?.a).toBeCloseTo(0.4);
    expect(row(rows, "Min")?.a).toBe(900);
  });

  it("refuses a rate under ninety minutes rather than inflating it", () => {
    // One minute and one recovery is 90 a game arithmetically and a lie about
    // football — `per90`'s floor is what stops it. The row survives because the
    // OTHER man has a rate worth printing; the substitute gets a dash beside it,
    // which says "not enough football yet" and not "none".
    const rows = rateRows(
      season({ minutes: 1, recoveries: 1 }),
      season({ minutes: 900, recoveries: 40 }),
    );
    expect(row(rows, "Recoveries")?.a).toBeNull();
    expect(row(rows, "Recoveries")?.b).toBeCloseTo(4);
  });

  it("keeps a denominator that is under the rate floor", () => {
    // The floor is about RATES. A man on four minutes has played four minutes,
    // and that is exactly the fact a reader needs to explain the dashes beside
    // it.
    const rows = rateRows(season({ minutes: 4 }), null);
    expect(row(rows, "Min")?.a).toBe(4);
  });

  it("drops a row neither of them has anything to say about", () => {
    // Two forwards have no saves between them, so Saves is not a row of noughts
    // — it is not a row.
    const rows = rateRows(
      season({ minutes: 900, expectedGoals: 4 }),
      season({ minutes: 900, expectedGoals: 3 }),
    );
    expect(row(rows, "Saves")).toBeUndefined();
  });

  it("keeps a row only one of them has", () => {
    // A keeper against an outfielder: the outfielder's nought is a real answer
    // about him, and dropping the row would silently shorten the comparison.
    const rows = rateRows(
      season({ minutes: 900, saves: 30 }),
      season({ minutes: 900, expectedGoals: 4 }),
    );
    const saves = row(rows, "Saves");
    expect(saves?.a).toBeCloseTo(3);
    expect(saves?.b).toBe(0);
  });

  it("gives a man with no football half a dash on every row", () => {
    // The 88 in the pool the bridge has never settled. The other side still
    // draws in full rather than the table collapsing.
    const rows = rateRows(null, season({ minutes: 900, expectedGoals: 4 }));
    expect(rows.every((each) => each.a === null)).toBe(true);
    expect(row(rows, "xG")?.b).toBeCloseTo(0.4);
  });

  it("has no rows at all for two men we know nothing about", () => {
    expect(rateRows(null, null)).toEqual([]);
  });

  it("never carries the three the competition counts", () => {
    // `SeasonTotals` binds goals, assists and clean sheets away from a fantasy
    // screen. This asserts the bound rather than trusting the list to stay
    // right, because the failure would be silent and would look correct.
    const rows = rateRows(season({ minutes: 900, goals: 9, assists: 5, cleanSheets: 4 }), null);
    const names = rows.map((each) => each.name);
    expect(names).not.toContain("Goals");
    expect(names).not.toContain("Assists");
    expect(names).not.toContain("Clean sheets");
  });
});

describe("the export's three counts", () => {
  it("rates touches, shots and key passes per ninety, in the ledger's order", () => {
    const rows = rateRows(season({ minutes: 900, starts: 10, touches: 500, shots: 20, keyPasses: 10 }), null);
    expect(rows.map((each) => each.name).slice(0, 5)).toEqual(["Min", "Starts", "Touches", "Shots", "Key passes"]);
    expect(row(rows, "Touches")?.a).toBeCloseTo(50);
    expect(row(rows, "Shots")?.a).toBeCloseTo(2);
    expect(row(rows, "Key passes")?.a).toBeCloseTo(1);
  });

  it("dashes a man the export never bridged", () => {
    const rows = rateRows(season({ minutes: 900 }), season({ minutes: 900, touches: 400, keyPasses: 3 }));
    expect(row(rows, "Key passes")?.a).toBeNull();
    expect(row(rows, "Key passes")?.b).toBeCloseTo(0.3);
  });

  it("keeps a covered man's nought beside a man who has some", () => {
    const rows = rateRows(season({ minutes: 900, touches: 300, shots: 0 }), season({ minutes: 900, touches: 400, shots: 20 }));
    expect(row(rows, "Shots")?.a).toBe(0);
  });
});

describe("how a row prints", () => {
  it("marks a rate as a rate even when it lands on a whole number", () => {
    // Haaland has no tackles and exactly two bonus points per ninety. Inferring
    // "is this a rate" from the VALUE printed those as `0` and `2` in a column
    // of `0.82` and `35.33`, which reads as a column with something wrong in it.
    const rows = rateRows(season({ minutes: 270, tackles: 0, bonus: 6 }), season({ minutes: 270, tackles: 4 }));
    expect(rows.find((each) => each.name === "Bonus")?.perNinety).toBe(true);
    expect(rows.find((each) => each.name === "Min")?.perNinety).toBe(false);
  });
});
