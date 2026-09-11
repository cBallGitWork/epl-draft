import { describe, expect, it } from "vitest";
import recordedFixture from "../__fixtures__/plFixture.json";
import type { RawPlFixture, RawPlFixtureEvent } from "./raw";
import { creditedGoals, goalGroups, plManMatches, plSubstitutions } from "./sheetEvents";
import type { PlGoal } from "./sheetEvents";

// Liverpool 2-2 Nottingham Forest, gameweek 2, recorded 4 Sep 2026 and never
// fetched (CODE_RULES §6). The same match `map.test.ts` uses, and it carries the
// four cases worth having: a scorer who was then substituted, a substitute who
// was then booked, a penalty, and a substitution in added time.
//
// It carries neither an own goal nor a red card — 5 and 1 respectively across
// the whole of gameweeks 1-3 — so those two are built by hand below rather than
// left untested because the recording happened not to contain them.
const DETAIL = recordedFixture as unknown as RawPlFixture;

/** FPL's `opta_code` → `code`, the app's own join. Every player on both sheets,
 *  coded as his id plus a million so a wrong join is visible rather than
 *  coincidental — the idiom `map.test.ts` set. */
const optaToCode = new Map(
  (DETAIL.teamLists ?? []).flatMap((list) =>
    list === null
      ? []
      : [...list.lineup, ...list.substitutes].flatMap((p) =>
          p.altIds ? [[p.altIds.opta, p.id + 1_000_000] as [string, number]] : [],
        ),
  ),
);

const men = plManMatches(DETAIL, optaToCode);
/** His FPL code under the fixture's own coding above. */
const of = (plId: number) => men.get(plId + 1_000_000);

const NDOYE = 50623;
const ARAUJO = 66133;
const GIBBS_WHITE = 15259;
const DOMINGUEZ = 115172;
const MUNOZ = 119386;
const VIRGIL = 5140;

/** A fixture carrying nothing but the events handed in, joined through one man. */
function synthetic(events: RawPlFixtureEvent[]): ReturnType<typeof plManMatches> {
  const one = DETAIL.teamLists?.[0];
  if (one === null || one === undefined) throw new Error("recording has no team sheet");
  return plManMatches({ ...DETAIL, events }, optaToCode);
}

describe("plManMatches", () => {
  it("pairs a substitution's two halves onto the two different men", () => {
    // 66' — Delap on, Ndoye off. The one row is `ON` and the other `OFF`, and a
    // reader that took `personId` without the description would file both under
    // whichever it saw last.
    expect(of(NDOYE)?.offAt).toBe(66);
    expect(of(NDOYE)?.onAt).toBeNull();
    expect(of(51813)?.onAt).toBe(66);
    expect(of(51813)?.offAt).toBeNull();
  });

  it("keeps a scorer's goal when he is later substituted", () => {
    expect(of(NDOYE)?.goals).toEqual([24]);
  });

  it("carries both marks for a substitute who is then booked", () => {
    // Araujo on at 77 and booked at 79 — the case that catches a map keyed per
    // event kind rather than per man.
    expect(of(ARAUJO)?.onAt).toBe(77);
    expect(of(ARAUJO)?.booked).toBe(79);
    expect(of(ARAUJO)?.sentOff).toBeNull();
  });

  it("counts a penalty as the scorer's goal", () => {
    // `P` is its own type. A reader taking only `G` loses every penalty — 4 of
    // the 85 goals in gameweeks 1-3.
    expect(of(GIBBS_WHITE)?.goals).toEqual([70]);
  });

  it("reads a booking and a goal onto one man in the right fields", () => {
    expect(of(MUNOZ)?.booked).toBe(54);
    expect(of(MUNOZ)?.goals).toEqual([82]);
  });

  it("drops the added-time half of a minute", () => {
    // On at "90+2'00". A 92nd-minute substitution is a 90th-minute one on any
    // teleprinter, and `Number.parseInt` stopping at the `+` is the whole rule.
    expect(of(DOMINGUEZ)?.onAt).toBe(90);
  });

  it("leaves a man who played the whole match with no minutes at all", () => {
    expect(of(VIRGIL)).toBeUndefined();
  });

  it("does not credit an own goal as a goal", () => {
    // The one arithmetic error a scoresheet cannot survive.
    const map = synthetic([
      { type: "O", description: "O", personId: NDOYE, clock: { secs: 600, label: "10'00" } },
    ]);
    expect(map.get(NDOYE + 1_000_000)?.ownGoals).toEqual([10]);
    expect(map.get(NDOYE + 1_000_000)?.goals).toEqual([]);
  });

  it("files a red card as a sending off and not as a booking", () => {
    const map = synthetic([
      { type: "B", description: "R", personId: NDOYE, clock: { secs: 2400, label: "40'00" } },
    ]);
    expect(map.get(NDOYE + 1_000_000)?.sentOff).toBe(40);
    expect(map.get(NDOYE + 1_000_000)?.booked).toBeNull();
  });

  it("keeps both when a man is booked and later sent off", () => {
    const map = synthetic([
      { type: "B", description: "Y", personId: NDOYE, clock: { secs: 600, label: "10'00" } },
      { type: "B", description: "R", personId: NDOYE, clock: { secs: 3600, label: "60'00" } },
    ]);
    expect(map.get(NDOYE + 1_000_000)?.booked).toBe(10);
    expect(map.get(NDOYE + 1_000_000)?.sentOff).toBe(60);
  });

  it("skips a card shown to nobody", () => {
    // One of the 118 bookings in gameweeks 1-3 carries a teamId and no
    // personId — a bench or staff card. It belongs to a side and has no name to
    // sit beside, so it is dropped rather than guessed at.
    const map = synthetic([
      { type: "B", description: "Y", teamId: 10, clock: { secs: 4260, label: "71'00" } },
    ]);
    expect(map.size).toBe(0);
  });

  it("skips a man the bridge cannot place", () => {
    // An empty join is the lag `scripts/pl-bridge.ts` exists for. He keeps his
    // name on the sheet and gains no marks, which beats a row keyed on a
    // provider id nothing else in the app speaks.
    expect(plManMatches(DETAIL, new Map()).size).toBe(0);
  });

  it("answers an empty map for a fixture nobody has played", () => {
    // `events` is absent on all ten upcoming fixtures of a round, which is the
    // exact tell for "not played" — and must not throw.
    expect(plManMatches({ ...DETAIL, events: undefined }, optaToCode).size).toBe(0);
  });
});

describe("plSubstitutions", () => {
  const swaps = plSubstitutions(DETAIL, optaToCode);
  const named = (code: number | null) => (code === null ? "?" : String(code - 1_000_000));

  it("pairs each man with the man he actually replaced", () => {
    // Liverpool made three changes at 71' at once. Pairing on the MINUTE alone
    // cannot tell them apart and the report drew Flemming coming on for Maeda
    // when he came on for Emersonn — two true men and one false sentence. The
    // feed's own order is the join: `ON` then its own `OFF`, 269 of 269.
    const at71 = swaps.filter((swap) => swap.minute === 71).map((s) => `${named(s.on)}>${named(s.off)}`);
    expect(at71).toEqual(["134796>32894", "49909>19919", "16006>116665"]);
  });

  it("finds every change and no more", () => {
    // Nine `ON` rows and nine `OFF` rows in the recording.
    expect(swaps).toHaveLength(9);
  });

  it("reads oldest first", () => {
    const minutes = swaps.map((swap) => swap.minute);
    expect([...minutes].sort((a, b) => a - b)).toEqual(minutes);
    expect(minutes[0]).toBe(66);
  });

  it("drops a pair that is not an ON followed by its OFF", () => {
    // Never seen on the wire; the guard is what lets the docblock claim the
    // ordering rather than hope for it.
    const scrambled = {
      ...DETAIL,
      events: [
        { type: "S", description: "OFF", personId: NDOYE, clock: { secs: 600, label: "10'00" } },
        { type: "S", description: "ON", personId: ARAUJO, clock: { secs: 600, label: "10'00" } },
      ],
    } as unknown as RawPlFixture;
    expect(plSubstitutions(scrambled, optaToCode)).toEqual([]);
  });

  it("keeps a pair whose man the bridge could not place", () => {
    // Half a known substitution beats none: dropping it would lose the other
    // man too, and he is somebody we can name.
    const swap = plSubstitutions(DETAIL, new Map());
    expect(swap).toHaveLength(9);
    expect(swap[0]).toMatchObject({ on: null, off: null });
  });
});

describe("plManMatches — assists", () => {
  it("credits the assister at the goal's own clock", () => {
    // Ndoye scored at 24' and Gibbs-White laid it on; the assist is the moment
    // the ball went in, not a moment of its own.
    expect(of(15259)?.assists).toEqual([24]);
  });

  it("keeps the scorer and the assister apart on one event", () => {
    // Only one of the two is `personId`. A reader taking that alone credits the
    // scorer twice and the assister never.
    expect(of(50623)?.goals).toEqual([24]);
    expect(of(50623)?.assists).toEqual([]);
  });

  it("credits nobody for an own goal or a penalty", () => {
    // Counted across gameweeks 1-3: `assistId` is on 56 of 76 `G` events and on
    // none of the 5 own goals or 4 penalties. Nobody assists an own goal, and a
    // penalty is won rather than laid on.
    const map = synthetic([
      { type: "O", description: "O", personId: NDOYE, clock: { secs: 600, label: "10'00" } },
      { type: "P", description: "P", personId: ARAUJO, clock: { secs: 1200, label: "20'00" } },
    ]);
    for (const man of map.values()) expect(man.assists).toEqual([]);
  });

  it("gives a man both when he scored one and made another", () => {
    const map = synthetic([
      { type: "G", description: "G", personId: NDOYE, clock: { secs: 600, label: "10'00" } },
      {
        type: "G",
        description: "G",
        personId: ARAUJO,
        assistId: NDOYE,
        clock: { secs: 3000, label: "50'00" },
      },
    ]);
    expect(map.get(NDOYE + 1_000_000)).toMatchObject({ goals: [10], assists: [50] });
  });
});

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
    expect(groups).toEqual([{ scorer: 50, own: false, minutes: [6, 9], assisters: [70] }]);
  });

  it("keeps two assisters when two different men laid them on", () => {
    const groups = goalGroups([
      goal({ minute: 6, scorer: 50, assister: 70 }),
      goal({ minute: 9, scorer: 50, assister: 80 }),
    ]);
    expect(groups[0].assisters).toEqual([70, 80]);
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
});
