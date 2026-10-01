import { describe, expect, it } from "vitest";
import { FRIDAY, SUNDAY, benchTurned, lateDecider } from "./__fixtures__/gw5";
import { SATURDAY } from "./__fixtures__/draftMan";
import { beatOf, ledForGood, timeline } from "./timeline";

describe("timeline", () => {
  it("runs the score day by day, then the substitutions, with the men who returned in each", () => {
    const beats = timeline(lateDecider().state);
    expect(beats.map((b) => [b.day, b.score.home, b.score.away])).toEqual([[FRIDAY, 0, 11], [SATURDAY, 16, 26], [SUNDAY, 34, 38], [null, 37, 38]]);
    expect(beats[2].returns.map((r) => [r.side, r.man.name, r.goals])).toEqual([["away", "Haaland", 1]]);
  });

  it("puts a reserve's returns in the substitutions, never on the day he played", () => {
    const beats = timeline(benchTurned().state);
    expect(beats.at(-1)).toMatchObject({ day: null, score: { home: 28, away: 33 } });
    expect(beats.at(-1)!.returns.map((r) => r.man.name)).toEqual(["Vuskovic"]);
    expect(beats.flatMap((b) => (b.day === null ? [] : b.returns)).map((r) => r.man.name)).not.toContain("Vuskovic");
  });

  it("finds where the winner's last unbroken lead began, and the beat a man belongs in", () => {
    const ctx = benchTurned();
    expect(ledForGood(timeline(ctx.state), "away")).toBe(2);
    expect(ledForGood(timeline(lateDecider().state), "away")).toBe(0);
    const vuskovic = ctx.state.away.side.bench[0];
    expect(beatOf(ctx.state, vuskovic)).toBeNull();
    expect(beatOf(ctx.state, ctx.state.away.side.eleven[0])).toBe(SATURDAY);
    expect(beatOf(ctx.state, ctx.state.away.side.eleven[1])).toBeUndefined();
  });
});
