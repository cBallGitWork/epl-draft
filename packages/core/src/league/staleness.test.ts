import { describe, expect, it } from "vitest";
import { captureStaleness } from "./staleness";

const DRAFT = "2026-10-10";

describe("captureStaleness", () => {
  it("treats never having captured as overdue", () => {
    // The whole point is noticing absence. Reporting "fine" on an empty history
    // is the silent failure this exists to prevent.
    const result = captureStaleness([], "2026-08-05", DRAFT);
    expect(result.lastCapture).toBeNull();
    expect(result.ageDays).toBeNull();
    expect(result.overdue).toBe(true);
  });

  it("picks the most recent capture regardless of input order", () => {
    const result = captureStaleness(
      ["2026-08-01", "2026-08-19", "2026-08-12"],
      "2026-08-19",
      DRAFT,
    );
    expect(result.lastCapture).toBe("2026-08-19");
    expect(result.ageDays).toBe(0);
    expect(result.overdue).toBe(false);
  });

  it("allows a week between captures before the draft", () => {
    expect(captureStaleness(["2026-08-05"], "2026-08-12", DRAFT).overdue).toBe(false);
    expect(captureStaleness(["2026-08-05"], "2026-08-13", DRAFT).overdue).toBe(true);
  });

  it("tightens to a day once the draft has happened", () => {
    // From draft day on, a missed day is a day of roster history that cannot be
    // recovered from anywhere.
    expect(captureStaleness(["2026-10-11"], "2026-10-12", DRAFT).maxAgeDays).toBe(1);
    expect(captureStaleness(["2026-10-11"], "2026-10-12", DRAFT).overdue).toBe(false);
    expect(captureStaleness(["2026-10-11"], "2026-10-13", DRAFT).overdue).toBe(true);
  });

  it("switches cadence on draft day itself, not the day after", () => {
    expect(captureStaleness(["2026-10-05"], "2026-10-09", DRAFT).maxAgeDays).toBe(7);
    expect(captureStaleness(["2026-10-05"], DRAFT, DRAFT).maxAgeDays).toBe(1);
  });

  it("counts age across a month boundary", () => {
    expect(captureStaleness(["2026-08-30"], "2026-09-02", DRAFT).ageDays).toBe(3);
  });
});
