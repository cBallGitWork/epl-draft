import { describe, expect, it } from "vitest";
import stream from "../__fixtures__/plTextstreamAssists.json";
import fixture from "../__fixtures__/plFixtureAssists.json";
import type { RawPlEvent, RawPlFixture, RawPlTextstream } from "./raw";
import { injuredOff, streamCredited, streamCredits } from "./assists";
import { plGoals } from "./goals";
import type { PlGoal } from "./goals";

// Manchester United 5-2 Ipswich Town, gameweek 2, recorded 11 Sep 2026 and never
// fetched (CODE_RULES §6). It is the fixture Craig found the defect in and it
// carries all three of the assists Opta does not place, one each:
//
//   40'  Fernandes, assisted by Cunha            — Opta has it
//   56'  Greaves OWN GOAL, forced by Maguire     — Opta has nobody
//   61'  Fernandes PENALTY, won by Cunha         — Opta has nobody
//   68'  Fernandes, rebound off Mbeumo's block   — Opta has nobody
//   82'  Mbeumo, assisted by Fernandes           — Opta has it
//
// FPL pays exactly five for those five: Cunha 2, Maguire 1, Fernandes 1,
// Mbeumo 1. That agreement across two sources is what `streamCredited` tests
// for, and it is why this fixture is the one worth recording.
const STREAM = stream as unknown as RawPlTextstream;
const DETAIL = fixture as unknown as RawPlFixture;
const EVENTS = STREAM.events.content as RawPlEvent[];

/** Opta person id → FPL code, as the app's own join makes it. Coded as the id
 *  plus a million so a wrong join is visible rather than coincidental — the
 *  idiom `map.test.ts` set. */
const codes = new Map(
  (DETAIL.teamLists ?? []).flatMap((list) =>
    list === null
      ? []
      : [...list.lineup, ...list.substitutes].map((p) => [p.id, p.id + 1_000_000] as const),
  ),
);

/** The men this fixture is about, by the same +1,000,000 rule.
 *
 *  **These are the Premier League's own person ids, which are NOT FPL's
 *  `opta_code` digits** — Maguire is person 9566 and `p95658`, Mbeumo person
 *  66360 and `p446008`. The first draft of this file used the opta codes and two
 *  cases failed with a real id on the left of the assertion, which is exactly
 *  what the +1,000,000 idiom is for: a wrong join shows up as a wrong number
 *  rather than as a plausible one. */
const CUNHA = 51202 + 1_000_000;
const MAGUIRE = 9566 + 1_000_000;
const FERNANDES = 23396 + 1_000_000;
const MBEUMO = 66360 + 1_000_000;
const GREAVES = 49254 + 1_000_000;

const credits = streamCredits(EVENTS, codes);
const at = (minute: number) => credits.find((c) => c.minute === minute);

describe("streamCredits", () => {
  it("reads every goal in the match, both sides", () => {
    // Five United and two Ipswich.
    expect(credits.map((c) => c.minute)).toEqual([29, 40, 56, 61, 68, 82, 90]);
  });

  it("keeps Opta's own pass where there is one", () => {
    // No inference beats a published field.
    expect(at(40)?.assister).toBe(CUNHA);
    expect(at(82)?.assister).toBe(FERNANDES);
  });

  it("credits the man who WON a penalty, two minutes before it was taken", () => {
    // `penalty won` at 59', converted at 61'. The pass Opta looks for does not
    // exist, and the event that does is not the one immediately before.
    expect(at(61)?.assister).toBe(CUNHA);
  });

  it("credits the man whose shot FORCED an own goal", () => {
    // Maguire's attempt is the event immediately before Greaves turns it in.
    expect(at(56)?.scorer).toBe(GREAVES);
    expect(at(56)?.assister).toBe(MAGUIRE);
  });

  it("credits the man whose BLOCKED shot left the rebound", () => {
    expect(at(68)?.assister).toBe(MBEUMO);
  });

  it("leaves a goal with no attempt before it unassisted", () => {
    // Nothing may be attached to a goal the commentary sets up with nothing.
    const lone: RawPlEvent[] = [
      { id: 1, type: "corner", text: "", time: { secs: 0, label: "10" } },
      { id: 2, type: "goal", text: "", time: { secs: 0, label: "10" }, playerIds: [51202] },
    ];
    expect(streamCredits(lone, codes)[0].assister).toBeNull();
  });

  it("does not reach past an intervening event for a rebound", () => {
    // The attempt must be IMMEDIATELY before, or a shot from four minutes back
    // lands on a name that had nothing to do with the goal.
    const stale: RawPlEvent[] = [
      { id: 1, type: "miss", text: "", time: { secs: 0, label: "10" }, playerIds: [95658] },
      { id: 2, type: "substitution", text: "", time: { secs: 0, label: "12" } },
      { id: 3, type: "goal", text: "", time: { secs: 0, label: "14" }, playerIds: [51202] },
    ];
    expect(streamCredits(stale, codes)[0].assister).toBeNull();
  });

  it("takes the MOST RECENT penalty won, not the first", () => {
    // A penalty won and missed early does not credit its winner for a second
    // penalty scored later.
    const two: RawPlEvent[] = [
      { id: 1, type: "penalty won", text: "", time: { secs: 0, label: "10" }, playerIds: [95658] },
      { id: 2, type: "penalty missed", text: "", time: { secs: 0, label: "11" } },
      { id: 3, type: "penalty won", text: "", time: { secs: 0, label: "70" }, playerIds: [51202] },
      {
        id: 4,
        type: "penalty goal",
        text: "",
        time: { secs: 0, label: "71" },
        playerIds: [23396],
      },
    ];
    expect(streamCredits(two, codes)[0].assister).toBe(CUNHA);
  });

  it("carries a man the bridge could not place as null rather than dropping him", () => {
    const unknown: RawPlEvent[] = [
      { id: 1, type: "goal", text: "", time: { secs: 0, label: "10" }, playerIds: [999, 998] },
    ];
    expect(streamCredits(unknown, codes)[0]).toEqual({
      minute: 10,
      scorer: null,
      assister: null,
    });
  });
});

describe("streamCredited", () => {
  // United's own five, as `plGoals` reads them off the fixture feed.
  const united = plGoals(DETAIL, new Map()).map((goal) => ({
    ...goal,
    scorer: goal.scorer,
  }));

  /** The five United goals, coded the same way, straight from the detail feed. */
  const ours: PlGoal[] = [
    { minute: 40, teamId: 12, scorer: FERNANDES, assister: CUNHA, own: false },
    { minute: 56, teamId: 12, scorer: GREAVES, assister: null, own: true },
    { minute: 61, teamId: 12, scorer: FERNANDES, assister: null, own: false },
    { minute: 68, teamId: 12, scorer: FERNANDES, assister: null, own: false },
    { minute: 82, teamId: 12, scorer: MBEUMO, assister: FERNANDES, own: false },
  ];

  /** What FPL paid United for this fixture, off the live read. */
  const paid = new Map([
    [CUNHA, 2],
    [MAGUIRE, 1],
    [FERNANDES, 1],
    [MBEUMO, 1],
  ]);

  it("reads the fixture feed's own goals, for the shape the caller passes in", () => {
    expect(united).toHaveLength(7);
  });

  it("fills the three Opta does not place, and FPL confirms all five", () => {
    const out = streamCredited(ours, credits, paid);
    expect(out?.map((g) => g.assister)).toEqual([CUNHA, MAGUIRE, CUNHA, MBEUMO, FERNANDES]);
  });

  it("refuses the whole proposal when FPL pays a man it did not name", () => {
    // One extra assist FPL paid to somebody the commentary never credited: the
    // two sources disagree, so nothing is asserted.
    const extra = new Map(paid).set(GREAVES, 1);
    expect(streamCredited(ours, credits, extra)).toBeNull();
  });

  it("refuses when the proposal credits a man MORE than FPL did", () => {
    const fewer = new Map(paid).set(CUNHA, 1);
    expect(streamCredited(ours, credits, fewer)).toBeNull();
  });

  it("refuses rather than part-applying when one goal is wrong", () => {
    // A proposal wrong about one goal gives no reason to be trusted about the
    // next, so the whole assignment goes rather than the bad leg.
    const wrong = credits.map((c) => (c.minute === 56 ? { ...c, assister: MBEUMO } : c));
    expect(streamCredited(ours, wrong, paid)).toBeNull();
  });

  it("never overwrites an assister Opta already placed", () => {
    const hostile = credits.map((c) => (c.minute === 40 ? { ...c, assister: MAGUIRE } : c));
    expect(streamCredited(ours, hostile, paid)?.[0].assister).toBe(CUNHA);
  });

  it("is null for a side with no goals, so the caller falls back", () => {
    expect(streamCredited([], credits, paid)).toBeNull();
  });

  it("matches on the scorer as well as the minute", () => {
    // Two goals in one minute must not swap assisters.
    const sameMinute: PlGoal[] = [
      { minute: 50, teamId: 12, scorer: FERNANDES, assister: null, own: false },
      { minute: 50, teamId: 12, scorer: MBEUMO, assister: null, own: false },
    ];
    const said = [
      { minute: 50, scorer: MBEUMO, assister: CUNHA },
      { minute: 50, scorer: FERNANDES, assister: MAGUIRE },
    ];
    const out = streamCredited(sameMinute, said, new Map([[CUNHA, 1], [MAGUIRE, 1]]));
    expect(out?.map((g) => g.assister)).toEqual([MAGUIRE, CUNHA]);
  });
});

describe("injuredOff", () => {
  /** Opta's own sentence, with the two men as `[on, off]` — the order checked
   *  against the fixture feed's own ON/OFF rows for the same minute. */
  const sub = (text: string, ids?: number[]): RawPlEvent => ({
    id: 1,
    type: "substitution",
    text,
    time: { secs: 0, label: "74" },
    playerIds: ids,
  });
  const named = new Map([
    [24659, 1_024_659],
    [129096, 1_129_096],
  ]);

  it("credits the man going OFF, who is the second id", () => {
    const hurt = injuredOff(
      [sub("Substitution, Brentford. Jannik Schuster replaces Nathan Collins because of an injury.", [129096, 24659])],
      named,
    );
    expect([...hurt]).toEqual([1_024_659]);
  });

  it("leaves an ordinary substitution alone", () => {
    expect(
      injuredOff([sub("Substitution, IPS. Kasey McAteer replaces Abdul Fatawu.", [129096, 24659])], named).size,
    ).toBe(0);
  });

  it("reads the phrase and never the name", () => {
    // The TEST is a sentence and the ANSWER is an id. A man the feed calls
    // something else is still found.
    const hurt = injuredOff([sub("Substitution, X. Somebody Else replaces Someone because of an injury.", [129096, 24659])], named);
    expect([...hurt]).toEqual([1_024_659]);
  });

  it("credits nobody when the line carries no second man", () => {
    expect(injuredOff([sub("Substitution because of an injury.", [129096])], named).size).toBe(0);
    expect(injuredOff([sub("Substitution because of an injury.")], named).size).toBe(0);
  });

  it("ignores a man the bridge cannot place", () => {
    expect(injuredOff([sub("X replaces Y because of an injury.", [1, 2])], named).size).toBe(0);
  });

  it("refuses the `start delay` injury, which names its man in prose only", () => {
    const delay: RawPlEvent = {
      id: 2,
      type: "start delay",
      text: "Delay in match because of an injury Nathan Collins (Brentford).",
      time: { secs: 0, label: "20" },
    };
    expect(injuredOff([delay], named).size).toBe(0);
  });

  it("finds every injury in a feed, not just the first", () => {
    const two = [
      sub("A replaces B because of an injury.", [129096, 24659]),
      sub("C replaces D because of an injury.", [24659, 129096]),
    ];
    expect(injuredOff(two, named).size).toBe(2);
  });
});
