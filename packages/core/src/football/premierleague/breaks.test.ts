import { describe, expect, it } from "vitest";
import type { RawPlFixture } from "./raw";
import { mapRoundBreaks } from "./breaks";

// The shapes are the ones counted live on GW3, 5 Sep 2026 — see `breaks.ts` for
// the count. A fixture that has not started, one in its first half, one past it
// and one complete are the four states this has to tell apart.

const KICKOFF = 1_788_616_800_000;

function fixture(over: Partial<RawPlFixture>): RawPlFixture {
  return {
    id: 1,
    status: "U",
    phase: "0",
    teams: [],
    kickoff: { label: "", millis: KICKOFF },
    altIds: { opta: "g2645221" },
    ...over,
  } as RawPlFixture;
}

describe("mapRoundBreaks", () => {
  it("gives nothing for a match nobody has started", () => {
    expect(mapRoundBreaks([fixture({})])).toEqual([]);
  });

  it("gives nothing while the first half is still on", () => {
    const live = fixture({ status: "L", phase: "1", clock: { secs: 480, label: "08'00" } });
    expect(mapRoundBreaks([live])).toEqual([]);
  });

  it("gives half time once the match is past the first half", () => {
    const live = fixture({ status: "L", phase: "2", clock: { secs: 3000, label: "50'00" } });
    const breaks = mapRoundBreaks([live]);
    expect(breaks.map((b) => b.kind)).toEqual(["half-time"]);
    expect(breaks[0]?.seconds).toBe(45 * 60);
    expect(breaks[0]?.absolute).toBe(KICKOFF + 45 * 60 * 1000);
  });

  // The bound that matters: a goal at 45+3 is 2,824 seconds, past the nominal
  // forty-five, and HALF TIME under it would read as a goal scored after it.
  it("puts half time after the last goal of the first half", () => {
    const live = fixture({
      status: "L",
      phase: "2",
      goals: [
        { personId: 1, clock: { secs: 360, label: "06'00" }, phase: "1", type: "G" },
        { personId: 2, clock: { secs: 2824, label: "45+3'00" }, phase: "1", type: "G" },
      ],
    });
    expect(mapRoundBreaks([live])[0]?.seconds).toBe(2825);
  });

  // The second half's own clock restarts at 2,700, so a 46th-minute goal reads
  // 2,760 — lower than the first half's stoppage. Only the goal's own `phase`
  // separates them, which is why the clock is not read for it.
  it("ignores second-half goals when placing half time", () => {
    const live = fixture({
      status: "L",
      phase: "2",
      goals: [{ personId: 1, clock: { secs: 2760, label: "46'00" }, phase: "2", type: "G" }],
    });
    expect(mapRoundBreaks([live])[0]?.seconds).toBe(45 * 60);
  });

  it("gives both breaks for a finished match, at the feed's own final clock", () => {
    const done = fixture({
      status: "C",
      phase: "F",
      clock: { secs: 5760, label: "90+6'00" },
    });
    const breaks = mapRoundBreaks([done]);
    expect(breaks.map((b) => b.kind)).toEqual(["half-time", "full-time"]);
    expect(breaks[1]?.seconds).toBe(5760);
    expect(breaks[1]?.absolute).toBe(KICKOFF + 5760 * 1000);
  });

  it("drops a fixture with no FPL code, since nothing could join it", () => {
    const done = { ...fixture({ status: "C", phase: "F" }), altIds: undefined };
    expect(mapRoundBreaks([done])).toEqual([]);
  });

  it("carries no wall clock for a fixture that is dated and not timed", () => {
    const done = fixture({ status: "C", phase: "F", kickoff: { label: "" } });
    expect(mapRoundBreaks([done]).every((b) => b.absolute === null)).toBe(true);
  });

  it("orders a round by the wall clock, not by the match clock", () => {
    const early = { ...fixture({ status: "C", phase: "F", clock: { secs: 5700, label: "" } }) };
    const late = {
      ...fixture({ status: "C", phase: "F", clock: { secs: 5700, label: "" } }),
      kickoff: { label: "", millis: KICKOFF + 3 * 60 * 60 * 1000 },
      altIds: { opta: "g2645222" },
    };
    const codes = mapRoundBreaks([late, early]).map((b) => b.fixtureCode);
    expect(codes).toEqual([2645221, 2645221, 2645222, 2645222]);
  });
});
