import { describe, expect, it } from "vitest";
import { plannable } from "./plannable";

// The planner edits one week only: the open one. Any other week of your own is read-only (Craig, 30 Sep 2026).
describe("plannable", () => {
  const open = { gameweek: 7, period: 7 };

  it("opens on the week whose lineups are still open", () => {
    expect(plannable({ gameweek: 7, period: 7 }, open)).toBe(true);
  });

  it("stays shut on a week that has locked, even when a link names it", () => {
    expect(plannable({ gameweek: 6, period: 6 }, open)).toBe(false);
  });

  it("stays shut on a week further ahead than the open one", () => {
    expect(plannable({ gameweek: 8, period: 8 }, open)).toBe(false);
  });

  it("stays shut when the calendar cannot name the open week", () => {
    expect(plannable({ gameweek: 6, period: 6 }, null)).toBe(false);
    expect(plannable(null, null)).toBe(false);
  });
});
