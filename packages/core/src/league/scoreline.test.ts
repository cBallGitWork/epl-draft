import { describe, expect, it } from "vitest";
import { leads, trails } from "./scoreline";

describe("leads and trails", () => {
  it("reads two real totals the way a scoreline does", () => {
    expect(leads(16, 5)).toBe(true);
    expect(trails(16, 5)).toBe(false);
    expect(leads(5, 16)).toBe(false);
    expect(trails(5, 16)).toBe(true);
  });

  it("calls a draw neither", () => {
    expect(leads(7, 7)).toBe(false);
    expect(trails(7, 7)).toBe(false);
  });

  it("never lets a number beat a dash, in either direction", () => {
    // The whole reason this exists. Fantrax has no total for a team it has not
    // scored, and the boards print a dash — dimming it as behind says its
    // manager is losing, and crowning the other side says the match is decided.
    expect(leads(16, null)).toBe(false);
    expect(trails(16, null)).toBe(false);
    expect(leads(null, 16)).toBe(false);
    expect(trails(null, 16)).toBe(false);
  });

  it("calls two dashes neither, rather than a draw", () => {
    expect(leads(null, null)).toBe(false);
    expect(trails(null, null)).toBe(false);
  });

  it("treats a real nought as a real number", () => {
    // Nought is a score somebody earned. Only null is absence.
    expect(trails(0, 5)).toBe(true);
    expect(leads(5, 0)).toBe(true);
  });
});
