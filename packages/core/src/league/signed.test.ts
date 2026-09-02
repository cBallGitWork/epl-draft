import { describe, expect, it } from "vitest";
import { signed } from "./signed";

describe("signed", () => {
  it("shows the sign a positive figure would otherwise hide", () => {
    expect(signed(4)).toBe("+4");
  });

  it("leaves a negative alone — the minus is already there", () => {
    expect(signed(-2)).toBe("-2");
  });

  it("gives nought no sign", () => {
    // `+0` reads as a claim that something went up. It did not.
    expect(signed(0)).toBe("0");
  });
});
