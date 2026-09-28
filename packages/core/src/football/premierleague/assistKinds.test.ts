import { describe, expect, it } from "vitest";
import { creditSide, kindCredited, type AssistKinds } from "./assistKinds";
import type { PlGoal } from "./goals";

// Every case is a real one from GW1-5, counted off the stats league on 28 Sep 2026.

const goal = (over: Partial<PlGoal>): PlGoal => ({
  minute: 10,
  teamId: 1,
  scorer: 100,
  assister: null,
  own: false,
  ...over,
});

const kinds = (over: Partial<AssistKinds>): AssistKinds => ({
  penaltyWon: 0,
  ownGoalForced: 0,
  freeKickWon: 0,
  freeKickGoals: 0,
  ...over,
});

const assisters = (goals: PlGoal[]) => goals.map((g) => [g.minute, g.assister]);

// Man Utd 5-2 Ipswich, GW2: Opta placed two of five, and FPL paid Cunha 2, Maguire 1, Fernandes 1, Mbeumo 1.
const [CUNHA, MAGUIRE, FERNANDES, MBEUMO, GREAVES] = [1, 2, 3, 4, 5];
const united = [
  goal({ minute: 40, scorer: FERNANDES, assister: CUNHA }),
  goal({ minute: 56, scorer: GREAVES, own: true }),
  goal({ minute: 61, scorer: FERNANDES, penalty: true }),
  goal({ minute: 68, scorer: FERNANDES }),
  goal({ minute: 82, scorer: MBEUMO, assister: FERNANDES }),
];
const unitedPaid = new Map([[CUNHA, 2], [MAGUIRE, 1], [FERNANDES, 1], [MBEUMO, 1]]);
const unitedKinds = new Map([
  [MAGUIRE, kinds({ ownGoalForced: 1 })],
  [CUNHA, kinds({ penaltyWon: 1 })],
]);

describe("kindCredited", () => {
  it("puts the forced own goal and the penalty won on the goals they made", () => {
    expect(assisters(kindCredited(united, unitedKinds, unitedPaid))).toEqual([
      [40, CUNHA],
      [56, MAGUIRE],
      [61, CUNHA],
      [68, null],
      [82, FERNANDES],
    ]);
  });

  it("credits the own goal and leaves the open goal three men could have made", () => {
    // Leeds, GW4: Miley's own goal at 32' and Okafor's at 59', with Ampadu, Tanaka and Calvert-Lewin each owed one.
    const [AMPADU, TANAKA, DCL] = [21, 22, 23];
    const goals = [goal({ minute: 32, scorer: 30, own: true }), goal({ minute: 59, scorer: 31 })];
    const paid = new Map([[AMPADU, 1], [TANAKA, 1], [DCL, 1]]);
    expect(assisters(kindCredited(goals, new Map([[TANAKA, kinds({ ownGoalForced: 1 })]]), paid))).toEqual([
      [32, TANAKA],
      [59, null],
    ]);
  });

  it("finds the free kick by its scorer's own free-kick goals", () => {
    // Man City, GW5: Enzo's 9' was the free kick Ndiaye won; Semenyo's 57' was not.
    const [ENZO, SEMENYO, NDIAYE] = [41, 42, 43];
    const goals = [goal({ minute: 9, scorer: ENZO }), goal({ minute: 57, scorer: SEMENYO })];
    const said = new Map([[NDIAYE, kinds({ freeKickWon: 1 })], [ENZO, kinds({ freeKickGoals: 1 })]]);
    expect(assisters(kindCredited(goals, said, new Map([[NDIAYE, 1]])))).toEqual([
      [9, NDIAYE],
      [57, null],
    ]);
  });

  it("refuses a free kick when its scorer has more unplaced goals than free kicks", () => {
    const goals = [goal({ minute: 9, scorer: 41 }), goal({ minute: 57, scorer: 41 })];
    const said = new Map([[43, kinds({ freeKickWon: 1 })], [41, kinds({ freeKickGoals: 1 })]]);
    expect(assisters(kindCredited(goals, said, new Map([[43, 1]])))).toEqual([[9, null], [57, null]]);
  });

  it("refuses when two men on the side claim the same kind", () => {
    const goals = [goal({ minute: 61, penalty: true })];
    const said = new Map([[1, kinds({ penaltyWon: 1 })], [2, kinds({ penaltyWon: 1 })]]);
    expect(assisters(kindCredited(goals, said, new Map([[1, 1], [2, 1]])))).toEqual([[61, null]]);
  });

  it("refuses a man FPL paid nothing in this match, whose kind was another match's", () => {
    const goals = [goal({ minute: 61, penalty: true })];
    expect(assisters(kindCredited(goals, new Map([[1, kinds({ penaltyWon: 1 })]]), new Map()))).toEqual([[61, null]]);
  });

  it("never credits a man with his own goal", () => {
    const goals = [goal({ minute: 61, scorer: 1, penalty: true })];
    const paid = new Map([[1, 1]]);
    expect(assisters(kindCredited(goals, new Map([[1, kinds({ penaltyWon: 1 })]]), paid))).toEqual([[61, null]]);
  });
});

describe("creditSide", () => {
  it("places all three of United's without the commentary", () => {
    expect(assisters(creditSide(united, [], unitedKinds, unitedPaid))).toEqual([
      [40, CUNHA],
      [56, MAGUIRE],
      [61, CUNHA],
      [68, MBEUMO],
      [82, FERNANDES],
    ]);
  });

  it("answers as before when the stats league says nothing", () => {
    expect(assisters(creditSide(united, [], new Map(), unitedPaid))).toEqual([
      [40, CUNHA],
      [56, null],
      [61, null],
      [68, null],
      [82, FERNANDES],
    ]);
  });
});
