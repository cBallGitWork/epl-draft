import { describe, expect, it } from "vitest";
import type { Availability } from "@epl/core";
import { DASH } from "@epl/core";
import { condition } from "./condition";

const FIT: Availability = { state: "fit", label: "", out: false, chance: null, news: "" };

describe("condition", () => {
  it("says a fit man is fit, at a hundred percent", () => {
    expect(condition(FIT)).toEqual({ said: "Fit", chance: "100%" });
  });

  it("says the chance once, beside a note that repeated it", () => {
    // Semenyo, 30 Sep 2026: "Ankle injury - 75% chance of playing" beside 75%.
    const doubt: Availability = { state: "doubt", label: "Dbt", out: false, chance: 75, news: "Ankle injury - 75% chance of playing" };
    expect(condition(doubt)).toEqual({ said: "Ankle injury", chance: "75%" });
  });

  it("keeps a note that says more than the chance, and prints a stated nought", () => {
    // Wieffer, 30 Sep 2026. Zero is FPL saying he will not play, not an absence.
    const out: Availability = { state: "injured", label: "Inj", out: true, chance: 0, news: "Knee injury - Unknown return date" };
    expect(condition(out)).toEqual({ said: "Knee injury - Unknown return date", chance: "0%" });
  });

  it("names the state when FPL wrote nothing, and dashes a chance it never gave", () => {
    const silent: Availability = { state: "suspended", label: "Sus", out: true, chance: null, news: "" };
    expect(condition(silent)).toEqual({ said: "Suspended", chance: DASH });
  });
});
