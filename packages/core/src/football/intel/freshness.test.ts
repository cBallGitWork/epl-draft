import { describe, expect, it } from "vitest";
import { INTEL_AGE_LIMIT_DAYS, intelFreshness } from "./freshness";

const NOW = new Date("2026-10-01T12:00:00Z");
const daysAgo = (days: number) => new Date(NOW.getTime() - days * 86_400_000).toISOString();

describe("intelFreshness", () => {
  it("calls an export past its kind's limit stale", () => {
    const squads = intelFreshness("squads", { season: "26-27", exportedAt: daysAgo(26) }, "26-27", NOW);
    expect(squads).toEqual({ ageDays: 26, limitDays: INTEL_AGE_LIMIT_DAYS.squads, stale: true });
  });

  it("keeps an export inside its limit fresh, to the hour", () => {
    const limit = INTEL_AGE_LIMIT_DAYS.touches ?? 0;
    expect(intelFreshness("touches", { season: "26-27", exportedAt: daysAgo(limit - 1 / 24) }, "26-27", NOW).stale).toBe(false);
    expect(intelFreshness("touches", { season: "26-27", exportedAt: daysAgo(limit + 1 / 24) }, "26-27", NOW).stale).toBe(true);
  });

  it("judges each kind by its own limit", () => {
    const tenDays = { season: "26-27", exportedAt: daysAgo(10) };
    expect(intelFreshness("matches", tenDays, "26-27", NOW).stale).toBe(true);
    expect(intelFreshness("xi", tenDays, "26-27", NOW).stale).toBe(false);
  });

  it("never calls a finished season's file stale", () => {
    const last = intelFreshness("lines", { season: "25-26", exportedAt: daysAgo(200) }, "26-27", NOW);
    expect(last).toEqual({ ageDays: 200, limitDays: null, stale: false });
  });

  it("gives a kind with no limit none", () => {
    expect(intelFreshness("careers", { season: "26-27", exportedAt: daysAgo(200) }, "26-27", NOW).stale).toBe(false);
  });

  it("calls an export that cannot say when it ran stale, since nothing vouches for it", () => {
    for (const exportedAt of [undefined, "", "not a date"]) {
      expect(intelFreshness("squads", { season: "26-27", exportedAt }, "26-27", NOW)).toEqual({
        ageDays: null,
        limitDays: INTEL_AGE_LIMIT_DAYS.squads,
        stale: true,
      });
    }
  });
});
