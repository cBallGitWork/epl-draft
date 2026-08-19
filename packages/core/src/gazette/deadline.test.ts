import { describe, expect, it } from "vitest";
import type { LeaguePeriod } from "../league/types";
import { LINEUP_LOCK_LEAD_MINUTES } from "../config";
import { nextDeadline } from "./deadline";

const period = (number: number, start: string): LeaguePeriod => ({
  number,
  start,
  end: "2026-12-31T00:00:00.0-0400",
});

describe("nextDeadline", () => {
  it("finds the next lock, not the one that has passed", () => {
    const periods = [
      period(1, "2026-08-21T15:00:00.0-0400"),
      period(2, "2026-08-28T15:00:00.0-0400"),
    ];
    expect(nextDeadline(periods, "2026-08-25T12:00:00Z")).toEqual({
      period: 2,
      at: "2026-08-28T15:00:00.0-0400",
      locksAt: "2026-08-28T18:45:00.000Z",
    });
  });

  it("locks a quarter of an hour before the period opens", () => {
    // The commissioner's rule, and the only figure on this page Fantrax did not
    // send us. The masthead used to announce the boundary as the lock and correct
    // itself in a footnote underneath; a manager reads the masthead.
    const at = nextDeadline([period(1, "2026-08-21T15:00:00.0-0400")], "2026-08-20T12:00:00Z");
    expect(Date.parse(at!.at) - Date.parse(at!.locksAt)).toBe(LINEUP_LOCK_LEAD_MINUTES * 60_000);
  });

  it("compares instants, not strings", () => {
    // The league's bounds carry -0400 and ours carry Z. Lexically, "2026-08-21T15"
    // sorts before "2026-08-21T19Z" while being four hours later.
    const periods = [period(1, "2026-08-21T15:00:00.0-0400")];
    expect(nextDeadline(periods, "2026-08-21T18:00:00Z")).not.toBeNull();
    expect(nextDeadline(periods, "2026-08-21T20:00:00Z")).toBeNull();
  });

  it("says nothing when the season is over or the calendar is missing", () => {
    expect(nextDeadline([], "2026-08-25T12:00:00Z")).toBeNull();
    expect(nextDeadline([period(1, "2026-08-21T15:00:00.0-0400")], "not a date")).toBeNull();
  });
});
