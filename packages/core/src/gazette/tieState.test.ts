import { describe, expect, it } from "vitest";
import { tieState } from "./tieState";
import type { LiveTeamScore } from "../league/points";

const score = (points: number | null, toPlay: number | null): LiveTeamScore => ({
  teamId: "t",
  points,
  toPlay,
});

describe("tieState", () => {
  it("calls a tie settled only when the trailing side has nobody left", () => {
    expect(tieState(score(50, 0), score(40, 0))).toBe("settled");
    expect(tieState(score(50, 3), score(40, 0))).toBe("settled");
    expect(tieState(score(50, 0), score(40, 1))).toBe("open");
  });

  it("calls a big lead probable only with the men below the threshold", () => {
    // 20 behind on 60 is a third of the leader's total — over the share — but
    // the call is only made with two or fewer still to come.
    expect(tieState(score(60, 0), score(40, 2))).toBe("probable");
    expect(tieState(score(60, 0), score(40, 3))).toBe("open");
    // A narrow lead is never probable however few are left: 5 on 60 is a
    // twelfth, under the share.
    expect(tieState(score(60, 0), score(55, 1))).toBe("open");
  });

  it("never calls on absence: null points, null toPlay, or a level tie", () => {
    // `toPlay` null is "they did not say", which is not "nobody left" — the
    // rule three screens have already relearned, now load-bearing in a CALL.
    expect(tieState(score(60, 0), score(40, null))).toBe("open");
    expect(tieState(score(null, 0), score(40, 0))).toBe("open");
    expect(tieState(score(40, 0), score(40, 0))).toBe("open");
    expect(tieState(undefined, score(40, 0))).toBe("open");
  });
});
