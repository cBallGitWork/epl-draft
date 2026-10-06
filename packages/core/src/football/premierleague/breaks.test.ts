import { describe, expect, it } from "vitest";
import type { RawPlFixture } from "./raw";
import { mapRoundBreaks } from "./breaks";
import { mapRoundGoals } from "./map";

// Four states to tell apart: not started, in the first half, past it, and complete.

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

  // Half time is not drawn: a match in play yields nothing, whichever half it is in.
  it("gives nothing for a match still being played", () => {
    for (const phase of ["1", "H", "2"]) {
      const live = fixture({ status: "L", phase, clock: { secs: 3000, label: "50'00" } });
      expect(mapRoundBreaks([live])).toEqual([]);
    }
  });

  it("gives full time at the feed's own final clock", () => {
    const done = fixture({ status: "C", phase: "F", clock: { secs: 5760, label: "90+6'00" } });
    const breaks = mapRoundBreaks([done]);
    expect(breaks.map((b) => b.kind)).toEqual(["full-time"]);
    expect(breaks[0]?.seconds).toBe(5760);
    expect(breaks[0]?.absolute).toBe(KICKOFF + 5760 * 1000);
  });

  // Full time sorts after the goals: both mappers over the SAME fixture, compared on `absolute`, as `wireLines` orders.
  it("sorts after every goal in its own match", () => {
    const done = fixture({
      status: "C",
      phase: "F",
      clock: { secs: 5760, label: "90+6'00" },
      goals: [
        { personId: 1, clock: { secs: 540, label: "09'00" }, phase: "1", type: "G" },
        { personId: 2, clock: { secs: 5700, label: "90+5'00" }, phase: "2", type: "G" },
      ],
    });
    const whistle = mapRoundBreaks([done])[0]?.absolute ?? 0;
    const goals = mapRoundGoals([done], new Map()).map((goal) => goal.absolute ?? 0);
    expect(goals).toHaveLength(2);
    for (const goal of goals) expect(whistle).toBeGreaterThan(goal);
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
    expect(codes).toEqual([2645221, 2645222]);
  });
});
