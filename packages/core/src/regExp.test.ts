import { describe, expect, it } from "vitest";
import { escapeRegExp } from "./regExp";

describe("escapeRegExp", () => {
  it("matches a name with a full stop and brackets as itself, not as a pattern", () => {
    const name = "B. Fernandes (c)";
    expect(new RegExp(`^${escapeRegExp(name)}$`).test(name)).toBe(true);
    expect(new RegExp(`^${escapeRegExp(name)}$`).test("BX Fernandes c")).toBe(false);
  });

  it("is legal under the unicode flag, where an unneeded escape throws", () => {
    expect(() => new RegExp(escapeRegExp("a.b*c+d?e^f$g{h}i(j)k|l[m]n\\o"), "u")).not.toThrow();
  });
});
