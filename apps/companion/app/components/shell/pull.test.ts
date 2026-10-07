import { describe, expect, it } from "vitest";
import { armed, intent, pullDistance } from "./pull";

const rules = { arm: 72, max: 112, damp: 0.5, intent: 10, steep: 1.5 };

describe("pullDistance", () => {
  it("lags the finger", () => {
    expect(pullDistance(100, rules)).toBe(50);
  });

  it("never comes down past its stop", () => {
    expect(pullDistance(1000, rules)).toBe(112);
  });

  it("is nothing for a finger moving up", () => {
    expect(pullDistance(-40, rules)).toBe(0);
  });
});

describe("armed", () => {
  it("refreshes from the arm distance on", () => {
    expect(armed(71, rules)).toBe(false);
    expect(armed(72, rules)).toBe(true);
  });
});

describe("intent", () => {
  it("waits until the finger has travelled far enough to say", () => {
    expect(intent(3, 6, rules)).toBeNull();
  });

  it("reads a steep downward drag as a pull", () => {
    expect(intent(4, 20, rules)).toBe("pull");
  });

  it("leaves a sideways swipe across a wide table alone", () => {
    expect(intent(20, 12, rules)).toBe("other");
  });

  it("leaves an upward scroll alone", () => {
    expect(intent(0, -20, rules)).toBe("other");
  });
});
