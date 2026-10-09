import { describe, expect, it } from "vitest";
import { matchupHref } from "./league/routes";
import { wholeNumber } from "./wholeNumber";

describe("wholeNumber", () => {
  it("reads the number a link names", () => {
    expect(wholeNumber("6")).toBe(6);
    expect(wholeNumber("38")).toBe(38);
  });

  it("reads an empty or blank value as none, never 0", () => {
    expect(wholeNumber("")).toBeNull();
    expect(wholeNumber("  ")).toBeNull();
    expect(wholeNumber(undefined)).toBeNull();
  });

  it("reads anything but a whole number above nought as none", () => {
    for (const text of ["0", "-3", "3.5", "3abc", "0x5", "1e1"]) expect(wholeNumber(text)).toBeNull();
  });

  it("reads back the gameweek matchupHref writes", () => {
    const written = new URL(matchupHref("abc", 7), "http://x").searchParams.get("gw") ?? undefined;
    expect(wholeNumber(written)).toBe(7);
  });
});
