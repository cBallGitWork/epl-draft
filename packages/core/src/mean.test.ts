import { describe, expect, it } from "vitest";
import { mean } from "./mean";

describe("mean", () => {
  it("averages the figures", () => {
    expect(mean([6, 7, 8.5])).toBe(7.166666666666667);
  });

  it("is null, not nought, with nothing to average", () => {
    expect(mean([])).toBeNull();
  });
});
