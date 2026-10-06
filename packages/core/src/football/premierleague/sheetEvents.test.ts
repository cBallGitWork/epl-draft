import { describe, expect, it } from "vitest";
import recordedFixture from "../__fixtures__/plFixture.json";
import type { RawPlFixture, RawPlFixtureEvent } from "./raw";
import { plManMatches, plSubstitutions } from "./sheetEvents";

// Liverpool 2-2 Nottingham Forest (GW2): a scorer then substituted, a sub then booked, a penalty, an added-time change.
// It has no own goal or red card, so those two are built by hand below.
const DETAIL = recordedFixture as unknown as RawPlFixture;

/** FPL's `opta_code` → `code` for both sheets, each man coded as his id plus a million so a wrong join shows. */
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
    // A bench or staff card carries a teamId and no personId: no name to sit beside, so it is dropped.
    const map = synthetic([
      { type: "B", description: "Y", teamId: 10, clock: { secs: 4260, label: "71'00" } },
    ]);
    expect(map.size).toBe(0);
  });

  it("skips a man the bridge cannot place", () => {
    // Unjoined, he keeps his name on the sheet and gains no marks, never a row keyed on a provider id.
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
    // Liverpool made three changes at 71': pairing on the minute alone puts the wrong man on for the wrong man.
    // The feed's own order is the join: `ON` then its own `OFF`.
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
    // Opta never puts `assistId` on an own goal or a penalty: nobody assists the one, and the other is won.
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
