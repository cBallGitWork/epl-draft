import { describe, expect, it } from "vitest";
import { realPositionLabel } from "./realPositions";

describe("realPositionLabel", () => {
  it("writes Championship Manager's own construction", () => {
    // `cm9900/11.jpg` closes with `Defender/Defensive Midfielder (Left/Centre)`.
    expect(realPositionLabel("LB", ["DM"])).toBe("Defender/Defensive Midfielder (Left/Centre)");
  });

  it("gives a centre-half one role and one side", () => {
    // Maguire. He was `CB (DM/LB/RB)` for one commit, off the depth chart.
    expect(realPositionLabel("CB", [])).toBe("Defender (Centre)");
  });

  it("keeps a left-sided centre-half a centre-half", () => {
    expect(realPositionLabel("LCB", [])).toBe("Defender (Centre)");
    expect(realPositionLabel("RCB", [])).toBe("Defender (Centre)");
  });

  it("does not repeat a role a man plays twice over", () => {
    expect(realPositionLabel("CB", ["RB"])).toBe("Defender (Centre/Right)");
  });

  it("gives a role with no side no brackets", () => {
    expect(realPositionLabel("ST", [])).toBe("Striker");
    expect(realPositionLabel("GK", [])).toBe("Goalkeeper");
  });

  it("files a winger as CM does, an attacking midfielder on a flank", () => {
    expect(realPositionLabel("LW", [])).toBe("Attacking Midfielder (Left)");
    expect(realPositionLabel("RW", ["LW"])).toBe("Attacking Midfielder (Right/Left)");
  });

  it("does not read the first letter as a side", () => {
    // `CM` is centre midfield and `CF` is centre forward — a rule that split the
    // leading letter off would be wrong on both.
    expect(realPositionLabel("CM", [])).toBe("Midfielder (Centre)");
    expect(realPositionLabel("CF", [])).toBe("Forward (Centre)");
  });

  it("prints a code it has never seen rather than guessing", () => {
    expect(realPositionLabel("SW", [])).toBe("SW");
  });

  it("has nothing to say when there is no position", () => {
    expect(realPositionLabel(null, [])).toBeNull();
    expect(realPositionLabel(null)).toBeNull();
    expect(realPositionLabel("", [])).toBeNull();
  });
});
