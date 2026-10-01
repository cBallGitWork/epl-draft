import { describe, expect, it } from "vitest";
import type { Availability } from "@epl/core";
import { fitnessNote } from "./condition";

const FIT: Availability = { state: "fit", label: "", out: false, chance: null, news: "" };

describe("fitnessNote", () => {
  it("says nothing about a fit man", () => {
    // Craig, 1 Oct 2026, of "Fit 100%": "just remove the chip row".
    expect(fitnessNote(FIT)).toBeNull();
  });

  it("says the chance once, after a note that repeated it", () => {
    // Semenyo, 30 Sep 2026: "Ankle injury - 75% chance of playing" beside 75%.
    const doubt: Availability = { state: "doubt", label: "Dbt", out: false, chance: 75, news: "Ankle injury - 75% chance of playing" };
    expect(fitnessNote(doubt)).toBe("Ankle injury, 75% chance of playing");
  });

  it("keeps a note that says more than the chance, and prints a stated nought", () => {
    // Wieffer, 30 Sep 2026. Zero is FPL saying he will not play, not an absence.
    const out: Availability = { state: "injured", label: "Inj", out: true, chance: 0, news: "Knee injury - Unknown return date" };
    expect(fitnessNote(out)).toBe("Knee injury - Unknown return date, 0% chance of playing");
  });

  it("names the state when FPL wrote nothing, and leaves out a chance it never gave", () => {
    const silent: Availability = { state: "suspended", label: "Sus", out: true, chance: null, news: "" };
    expect(fitnessNote(silent)).toBe("Suspended");
  });
});
