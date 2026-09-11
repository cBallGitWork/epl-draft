import { describe, expect, it } from "vitest";
import { creditedGoals, goalGroups } from "./goals";
import type { PlGoal } from "./goals";

// The two readings a scoresheet makes of a side's goals: who FPL thinks laid
// each one on, and how they fold into one row per scorer.
//
// **Split out of `sheetEvents.test.ts` on 11 Sep 2026**, following the source
// split rather than a line count — §4 is explicit that cutting a suite at line
// 300 means cutting it at whichever assertion happens to sit there. These cases
// moved because the functions did.
//
// Neither describe needs a recorded fixture: both take plain data a caller
// already holds, which is the whole point of them being pure.

/** A goal with the fields a case cares about, and defaults for the rest. Shared
 *  by both goal describes below rather than declared inside one of them. */
const goal = (over: Partial<PlGoal>): PlGoal => ({
  minute: 10,
  teamId: 1,
  scorer: 100,
  assister: null,
  own: false,
  ...over,
});

describe("creditedGoals", () => {
  it("leaves a goal Opta already credited alone", () => {
    const goals = [goal({ minute: 37, scorer: 1, assister: 2 })];
    expect(creditedGoals(goals, new Map([[2, 1]]))).toEqual(goals);
  });

  it("credits the one man whose shortfall is the side's unexplained goals", () => {
    // Newcastle 2-2 Bournemouth: Opta assists neither Bournemouth goal and FPL
    // gives Scott two — the 9th-minute goal and the own goal at 35'.
    const goals = [
      goal({ minute: 9, scorer: 50 }),
      goal({ minute: 35, scorer: 60, own: true }),
    ];
    expect(creditedGoals(goals, new Map([[70, 2]])).map((g) => g.assister)).toEqual([70, 70]);
  });

  it("refuses when two men could each claim a goal", () => {
    // No arithmetic says which of them laid on which, so neither is credited.
    const goals = [goal({ minute: 9, scorer: 50 }), goal({ minute: 35, scorer: 60 })];
    const two = new Map([
      [70, 1],
      [80, 1],
    ]);
    expect(creditedGoals(goals, two).map((g) => g.assister)).toEqual([null, null]);
  });

  it("refuses when the shortfall does not match the unexplained goals", () => {
    // One unexplained goal and a man wanting two of them is a sum that does not
    // add up; crediting him once would still misreport his afternoon.
    const goals = [goal({ minute: 9, scorer: 50 })];
    expect(creditedGoals(goals, new Map([[70, 2]]))[0].assister).toBeNull();
  });

  it("counts a man's placed assists before deciding he is short", () => {
    // Two FPL assists, one of them Opta's own, leaves a shortfall of one against
    // one unexplained goal — which resolves.
    const goals = [
      goal({ minute: 20, scorer: 50, assister: 70 }),
      goal({ minute: 60, scorer: 60, own: true }),
    ];
    expect(creditedGoals(goals, new Map([[70, 2]])).map((g) => g.assister)).toEqual([70, 70]);
  });

  it("does nothing for a side FPL pays no assists to", () => {
    const goals = [goal({ minute: 9, scorer: 50 })];
    expect(creditedGoals(goals, new Map())[0].assister).toBeNull();
  });
});

describe("goalGroups", () => {
  it("folds a man's two goals into one row and keeps both minutes", () => {
    // Ipswich 0-2 Liverpool, the match Craig was looking at: Isak twice, Gakpo
    // under each. One row, two minutes, one assister.
    const groups = goalGroups([
      goal({ minute: 6, scorer: 50, assister: 70 }),
      goal({ minute: 9, scorer: 50, assister: 70 }),
    ]);
    expect(groups).toEqual([
      { scorer: 50, own: false, minutes: [6, 9], assisters: [{ code: 70, minutes: [6, 9] }] },
    ]);
  });

  it("keeps two assisters when two different men laid them on, each with HIS minute", () => {
    // The whole point of the minute being per-assister: nothing else says which
    // of the two made which goal.
    const groups = goalGroups([
      goal({ minute: 6, scorer: 50, assister: 70 }),
      goal({ minute: 9, scorer: 50, assister: 80 }),
    ]);
    expect(groups[0].assisters).toEqual([
      { code: 70, minutes: [6] },
      { code: 80, minutes: [9] },
    ]);
  });

  it("orders rows by a scorer's FIRST goal, not his last", () => {
    const groups = goalGroups([
      goal({ minute: 6, scorer: 50 }),
      goal({ minute: 20, scorer: 60 }),
      goal({ minute: 80, scorer: 50 }),
    ]);
    expect(groups.map((group) => group.scorer)).toEqual([50, 60]);
    expect(groups[0].minutes).toEqual([6, 80]);
  });

  it("never folds a man's own goal into his real ones", () => {
    // They are credited to different sides; one row would put a goal on the
    // wrong scoresheet.
    const groups = goalGroups([
      goal({ minute: 6, scorer: 50 }),
      goal({ minute: 70, scorer: 50, own: true }),
    ]);
    expect(groups).toHaveLength(2);
    expect(groups.map((group) => group.own)).toEqual([false, true]);
  });

  it("gives each unplaced scorer a row of his own", () => {
    // Two nulls are two men, and folding them would invent one who scored both.
    const groups = goalGroups([
      goal({ minute: 6, scorer: null }),
      goal({ minute: 9, scorer: null }),
    ]);
    expect(groups.map((group) => group.minutes)).toEqual([[6], [9]]);
  });

  it("credits nobody where Opta did not", () => {
    expect(goalGroups([goal({ minute: 6, scorer: 50 })])[0].assisters).toEqual([]);
  });

  it("gives a man who assisted one of two goals only that goal's minute", () => {
    const groups = goalGroups([
      goal({ minute: 6, scorer: 50, assister: 70 }),
      goal({ minute: 9, scorer: 50 }),
    ]);
    expect(groups[0].minutes).toEqual([6, 9]);
    expect(groups[0].assisters).toEqual([{ code: 70, minutes: [6] }]);
  });
});
