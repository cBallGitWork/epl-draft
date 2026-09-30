import { describe, expect, it } from "vitest";
import { preferredFoot, shotLine } from "./shotLine";
import type { ShotLine } from "./shotLine";
import type { Shot } from "./intel/shots";

describe("shotLine", () => {
  const shot = (over: Partial<Shot>): Shot => ({
    code: 1, fplFixtureId: 1, minute: 10, x: 90, y: 50, xg: 0.1, xgot: null, outcome: "miss",
    situation: null, bodyPart: "right-foot", assistCode: null, pass: null, ...over,
  });

  it("counts his shots and each foot, and carries the chances he made", () => {
    const counted = shotLine([shot({ bodyPart: "head" }), shot({ bodyPart: "left-foot" }), shot({})], 4);
    expect(counted).toEqual({ struck: 3, created: 4, left: 1, right: 1 });
  });
});

describe("preferredFoot", () => {
  const feet = (left: number, right: number): ShotLine => ({ struck: left + right, created: 0, left, right });

  it("names the foot he shoots with", () => {
    expect(preferredFoot(feet(1, 9))).toBe("Right");
    expect(preferredFoot(feet(8, 1))).toBe("Left");
  });

  it("calls him two-footed when the weaker foot takes a third", () => {
    expect(preferredFoot(feet(4, 6))).toBe("Either");
  });

  it("says nothing on too few shots or no map", () => {
    expect(preferredFoot(feet(1, 3))).toBeNull();
    expect(preferredFoot(null)).toBeNull();
  });
});
