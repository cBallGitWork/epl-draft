import { describe, expect, it } from "vitest";
import recordedFixture from "../__fixtures__/plFixture.json";
import type { RawPlFixture, RawPlFixtureEvent } from "./raw";
import { plManMatches } from "./sheetEvents";

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
