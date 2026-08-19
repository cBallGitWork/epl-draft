import { describe, expect, it } from "vitest";
import type { LeaguePeriod } from "../league/types";
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
    });
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
