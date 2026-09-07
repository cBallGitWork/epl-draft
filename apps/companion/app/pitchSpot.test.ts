import { describe, expect, it } from "vitest";
import { pitchSpot } from "./pitchSpot";

describe("pitchSpot", () => {
  it("puts a keeper on his own line and a striker on the other one", () => {
    expect(pitchSpot("GK")!.x).toBeLessThan(pitchSpot("CB")!.x);
    expect(pitchSpot("ST")!.x).toBeGreaterThan(pitchSpot("CF")!.x);
  });

  it("runs the spine up the pitch in the order the roles are played in", () => {
    const spine = ["GK", "CB", "DM", "CM", "AM", "CF", "ST"].map((code) => pitchSpot(code)!.x);
    expect(spine).toEqual([...spine].sort((a, b) => a - b));
  });

  it("does not read the first letter as a side", () => {
    // `realPositions.ts` records the trap this exists to avoid: `CM` is centre
    // midfield and `CF` is centre forward, so a rule keying on the leading
    // letter would file both under a Centre side and be wrong about neither
    // being a flank role — but would also put `LCB` and `LB` at the same depth.
    expect(pitchSpot("CM")!.y).toBe(50);
    expect(pitchSpot("CF")!.y).toBe(50);
    expect(pitchSpot("LCB")!.x).toBe(pitchSpot("CB")!.x);
    expect(pitchSpot("LB")!.x).not.toBe(pitchSpot("LCB")!.x);
  });

  it("puts left and right on opposite touchlines, and mirrors them", () => {
    const left = pitchSpot("LB")!;
    const right = pitchSpot("RB")!;
    expect(left.y).toBeLessThan(50);
    expect(right.y).toBeGreaterThan(50);
    expect(left.y + right.y).toBe(100);
  });

  it("stands a role with no side in the middle", () => {
    // CM's own vocabulary gives `ST` no flank.
    expect(pitchSpot("ST")!.y).toBe(50);
  });

  it("refuses a code it has never seen rather than guessing the centre spot", () => {
    // An unknown role drawn in the middle of the pitch is a claim.
    // `realPositions.ts` sets the same rule for the label.
    expect(pitchSpot("SWEEPER")).toBeNull();
    expect(pitchSpot(null)).toBeNull();
  });

  it("keeps every spot on the pitch", () => {
    for (const code of ["GK", "CB", "LB", "RB", "LWB", "RWB", "DM", "CM", "LM", "RM", "AM", "CAM", "LAM", "RAM", "LW", "RW", "CF", "ST", "LCB", "RCB"]) {
      const spot = pitchSpot(code);
      expect(spot, code).not.toBeNull();
      expect(spot!.x).toBeGreaterThanOrEqual(0);
      expect(spot!.x).toBeLessThanOrEqual(100);
      expect(spot!.y).toBeGreaterThanOrEqual(0);
      expect(spot!.y).toBeLessThanOrEqual(100);
    }
  });
});
