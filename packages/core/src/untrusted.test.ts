import { describe, expect, it } from "vitest";
import { finiteOrNull } from "./untrusted";

describe("finiteOrNull", () => {
  it("passes a real number and refuses everything dressed as one", () => {
    expect(finiteOrNull(0)).toBe(0);
    expect(finiteOrNull(-1.5)).toBe(-1.5);
    for (const bad of ["3", Number.NaN, Number.POSITIVE_INFINITY, null, undefined, {}]) expect(finiteOrNull(bad)).toBeNull();
  });
});
