import { describe, expect, it } from "vitest";
import { captureStaleness } from "./staleness";

describe("captureStaleness", () => {
  it("treats never having captured as overdue", () => {
    // The whole point is noticing absence. Reporting "fine" on an empty history
    // is the silent failure this exists to prevent.
    const result = captureStaleness([], "2026-08-05", false);
    expect(result.lastCapture).toBeNull();
    expect(result.ageDays).toBeNull();
    expect(result.overdue).toBe(true);
  });

  it("picks the most recent capture regardless of input order", () => {
    const result = captureStaleness(
      ["2026-08-01", "2026-08-19", "2026-08-12"],
      "2026-08-19",
      false,
    );
    expect(result.lastCapture).toBe("2026-08-19");
    expect(result.ageDays).toBe(0);
    expect(result.overdue).toBe(false);
  });

  it("allows a week between captures before the draft", () => {
    // Six days is inside the cadence; on the seventh the weekly capture was due
    // and did not land.
    expect(captureStaleness(["2026-08-05"], "2026-08-11", false).overdue).toBe(false);
    expect(captureStaleness(["2026-08-05"], "2026-08-12", false).overdue).toBe(true);
  });

  it("tightens to a day once Fantrax says the draft is done", () => {
    // From then on, a missed day is a day of roster history that cannot be
    // recovered from anywhere.
    expect(captureStaleness(["2026-10-11"], "2026-10-12", true).cadenceDays).toBe(1);
    expect(captureStaleness(["2026-10-11"], "2026-10-11", true).overdue).toBe(false);
    expect(captureStaleness(["2026-10-11"], "2026-10-12", true).overdue).toBe(true);
  });

  it("stays weekly while the league has not drafted, whatever the date", () => {
    expect(captureStaleness(["2026-10-05"], "2026-10-11", false).cadenceDays).toBe(7);
  });

  it("counts age across a month boundary", () => {
    expect(captureStaleness(["2026-08-30"], "2026-09-02", false).ageDays).toBe(3);
  });
});

describe("the first missed capture", () => {
  it("fires the same day, which is the latency the schedule was tuned for", () => {
    // `capture.yml` runs 05:10 UTC and `capture-status.yml` at 14:25, nine hours
    // later and deliberately so. At that moment a newest capture of yesterday is
    // not one that is merely pending — it is one that did not happen.
    expect(captureStaleness(["2026-10-10"], "2026-10-11", true).overdue).toBe(true);
  });

  // Pins the intent rather than the number, so changing a cadence cannot quietly
  // reopen the gap.
  it("does not tolerate a whole missed cadence, whatever the cadence is", () => {
    const status = captureStaleness(["2026-10-10"], "2026-10-11", true);
    expect(status.ageDays).toBe(status.cadenceDays);
    expect(status.overdue).toBe(true);
  });
});
