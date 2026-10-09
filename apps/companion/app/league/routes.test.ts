import { describe, expect, it } from "vitest";
import { askedGameweek, matchupHref } from "./routes";

describe("askedGameweek", () => {
  it("reads the gameweek a link names", () => {
    expect(askedGameweek("6")).toBe(6);
    expect(askedGameweek("38")).toBe(38);
  });

  it("reads an empty or blank ?gw= as no gameweek, never gameweek 0", () => {
    expect(askedGameweek("")).toBeNull();
    expect(askedGameweek("  ")).toBeNull();
    expect(askedGameweek(undefined)).toBeNull();
  });

  it("reads anything but a whole gameweek as none", () => {
    for (const gw of ["0", "-3", "3.5", "3abc", "0x5", "1e1"]) expect(askedGameweek(gw)).toBeNull();
  });

  it("reads back what matchupHref writes", () => {
    const written = new URL(matchupHref("abc", 7), "http://x").searchParams.get("gw") ?? undefined;
    expect(askedGameweek(written)).toBe(7);
  });
});
