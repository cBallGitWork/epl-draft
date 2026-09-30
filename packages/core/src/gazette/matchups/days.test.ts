import { describe, expect, it } from "vitest";
import { draftMan } from "./__fixtures__/draftMan";
import { draftSide, eleven } from "./__fixtures__/draftSide";
import { LIMITS } from "./__fixtures__/limits";
import { worthOf } from "./__fixtures__/worth";
import { runningScore } from "./days";
import { matchupState } from "./state";
import type { DraftSide } from "./types";

const days = (...points: number[]) => points.map((p, i) => ({ day: `2026-09-2${5 + i}`, points: p }));
const run = (home: DraftSide, away: DraftSide) => runningScore(matchupState({ home, away }, worthOf(), LIMITS, "gameweek"));

describe("runningScore", () => {
  it("adds the days up, leaving out a day on which neither side scored", () => {
    expect(run(draftSide("123", 38, eleven("h"), [], days(0, 11, 15, 12)), draftSide("test2", 37, eleven("a"), [], days(0, 0, 26, 11)))).toEqual([
      { day: "2026-09-26", home: 11, away: 0 },
      { day: "2026-09-27", home: 26, away: 26 },
      { day: "2026-09-28", home: 38, away: 37 },
    ]);
  });

  it("ends on the substitutions when a reserve certain to come on changes the score, and not while he has yet to play", () => {
    const blank = eleven("h", { 1: draftMan("Dunk", "D", null, 0) });
    const on = draftSide("test3", 27, blank, [draftMan("Vuskovic", "D", 6, 90)], days(27));
    expect(run(on, draftSide("test4", 28, eleven("a"), [], days(28))).at(-1)).toEqual({ day: null, home: 33, away: 28 });
    const waiting = draftSide("test3", 27, blank, [draftMan("Munoz", "D", null, 0, 1)], days(27));
    expect(run(waiting, draftSide("test4", 28, eleven("a"), [], days(28))).at(-1)).toEqual({ day: "2026-09-25", home: 27, away: 28 });
  });
});
