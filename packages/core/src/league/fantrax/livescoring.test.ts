import { describe, expect, it } from "vitest";
import recorded from "./__fixtures__/liveScoring.json";
import { mapLiveScores } from "./livescoring";
import type { RawLiveScoring } from "./livescoring";

describe("mapLiveScores", () => {
  it("reads every team's total from one recorded response", () => {
    // Trimmed from a real 13 Aug read. Every total is zero because no football
    // has been played yet — which is the point: zero is what Fantrax said, and a
    // scoreboard that showed anything else would be inventing it.
    const scores = mapLiveScores(recorded as RawLiveScoring);
    expect(scores).toHaveLength(2);
    expect(scores.map((s) => s.points)).toEqual([0, 0]);
    expect(scores.every((s) => s.teamId.length > 0)).toBe(true);
  });

  it("counts the players who still have football to come", () => {
    const [first] = mapLiveScores(recorded as RawLiveScoring);
    // Four in the trimmed fixture, all yet to kick off.
    expect(first.toPlay).toBe(4);
  });

  it("counts down as fixtures finish", () => {
    const scores = mapLiveScores({
      statsPerTeam: {
        allTeamsStats: {
          a: { ACTIVE: { totalFpts: 41, remainingEventPercent: { p1: 0, p2: 0.5, p3: 1 } } },
        },
      },
    });
    expect(scores).toEqual([{ teamId: "a", points: 41, toPlay: 2 }]);
  });

  it("reports a missing total as unknown rather than nought", () => {
    // A team on nought and a team we have no number for are different things,
    // and only one of them is worth putting on a screen as a score.
    const scores = mapLiveScores({
      statsPerTeam: { allTeamsStats: { a: { ACTIVE: { remainingEventPercent: { p1: 1 } } } } },
    });
    expect(scores).toEqual([{ teamId: "a", points: null, toPlay: 1 }]);
  });

  it("skips a team with no active section rather than inventing one", () => {
    // Only ACTIVE scores, and only ACTIVE is public. A team without it is a team
    // we cannot speak for.
    expect(mapLiveScores({ statsPerTeam: { allTeamsStats: { a: {}, b: undefined } } })).toEqual([]);
  });

  it("survives a response with nothing in it", () => {
    expect(mapLiveScores({})).toEqual([]);
    expect(mapLiveScores({ statsPerTeam: {} })).toEqual([]);
  });

  it("says nothing about players when Fantrax lists none", () => {
    const scores = mapLiveScores({
      statsPerTeam: { allTeamsStats: { a: { ACTIVE: { totalFpts: 12 } } } },
    });
    expect(scores).toEqual([{ teamId: "a", points: 12, toPlay: null }]);
  });
});
