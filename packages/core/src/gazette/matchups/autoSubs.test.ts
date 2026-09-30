import { describe, expect, it } from "vitest";
import { LIMITS } from "./__fixtures__/limits";
import { autoSubs } from "./autoSubs";
import { draftMan } from "./__fixtures__/draftMan";
import type { DraftMan } from "./types";

const man = (name: string, slot: string, minutes: number, left = 0): DraftMan => draftMan(name, slot, null, minutes, left, { club: "X" });
const eleven = [man("Gk", "G", 90), man("D1", "D", 90), man("D2", "D", 90), man("D3", "D", 0), man("D4", "D", 90), man("M1", "M", 90), man("M2", "M", 90), man("M3", "M", 90), man("M4", "M", 90), man("F1", "F", 90), man("F2", "F", 90)];

describe("autoSubs", () => {
  it("brings on the first reserve in bench order who played and keeps the shape legal", () => {
    const subs = autoSubs(eleven, [man("B1", "M", 0), man("B2", "F", 90), man("B3", "D", 90)], LIMITS);
    expect(subs.map((s) => `${s.out.name}>${s.in.name}`)).toEqual(["D3>B2"]);
  });

  it("skips a reserve who would break a limit: a fourth forward, or a second keeper", () => {
    const three = eleven.map((m) => (m.name === "M4" ? man("F3", "F", 90) : m));
    const subs = autoSubs(three, [man("Gk2", "G", 90), man("B2", "F", 90), man("B3", "D", 90)], LIMITS);
    expect(subs.map((s) => `${s.out.name}>${s.in.name}`)).toEqual(["D3>B3"]);
  });

  it("keeps the shape's minimum: a blank defender among three is replaced only by a defender", () => {
    const back3 = eleven.map((m) => (m.name === "D4" ? man("M5", "M", 90) : m));
    expect(autoSubs(back3, [man("B2", "M", 90), man("B3", "D", 45)], LIMITS).map((s) => s.in.name)).toEqual(["B3"]);
  });

  it("waits on a man whose match is still to come, and marks a reserve yet to play as provisional", () => {
    const pending = eleven.map((m) => (m.name === "D3" ? man("D3", "D", 0, 1) : m));
    expect(autoSubs(pending, [man("B3", "D", 90)], LIMITS)).toEqual([]);
    expect(autoSubs(eleven, [man("B3", "D", 0, 1)], LIMITS)[0]?.provisional).toBe(true);
  });

  it("holds a pairing open while a man ahead of the blank, still to play, could take the reserve first", () => {
    // GW5 after Saturday: Elanga blank, Rodon still to play and ahead of him; at the end Davis went to Rodon.
    const saturday = eleven.map((m) => (m.name === "D3" ? man("Rodon", "D", 0, 1) : m.name === "F2" ? man("Elanga", "F", 0) : m));
    const [sub] = autoSubs(saturday, [man("Davis", "D", 90)], LIMITS);
    expect([sub?.out.name, sub?.in.name, sub?.provisional, sub?.ahead?.name]).toEqual(["Elanga", "Davis", true, "Rodon"]);
    expect(autoSubs(eleven, [man("B3", "D", 90)], LIMITS)[0]).toMatchObject({ provisional: false, ahead: null });
  });

  it("uses each reserve once, and leaves a blank unfilled when nobody fits", () => {
    const two = eleven.map((m) => (m.name === "D2" ? man("D2", "D", 0) : m));
    expect(autoSubs(two, [man("B3", "D", 90)], LIMITS).map((s) => `${s.out.name}>${s.in.name}`)).toEqual(["D2>B3"]);
  });
});
