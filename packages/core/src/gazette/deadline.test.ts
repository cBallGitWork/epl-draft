import { describe, expect, it } from "vitest";
import type { GameweekKickoff } from "../league/calendar";
import type { LeaguePeriod } from "../league/types";
import { LINEUP_LOCK_LEAD_MINUTES } from "../config";
import { nextDeadline } from "./deadline";

// The periods and kickoffs below are the real ones, because the bug this file
// now guards against is invisible against invented data: a period that opens at
// its own first kickoff behaves identically either way, and only period 4 — a
// Friday-morning open for a Saturday round — tells the two rules apart.

const period = (number: number, start: string, end: string): LeaguePeriod => ({
  number,
  start,
  end,
});

/** Periods 3 and 4 as Fantrax states them, and the rounds as FPL dates them. */
const P3 = period(3, "2026-09-04T15:00:00.0-0400", "2026-09-11T05:59:59.0-0400");
const P4 = period(4, "2026-09-11T06:00:00.0-0400", "2026-09-18T05:59:59.0-0400");

const KICKOFFS: GameweekKickoff[] = [
  // Gameweek 3 opens the period: a Friday night match.
  { gameweek: 3, kickoff: "2026-09-04T19:00:00Z" },
  { gameweek: 3, kickoff: "2026-09-05T14:00:00Z" },
  // Gameweek 4 has no Friday match, so its period opens a day before its football.
  { gameweek: 4, kickoff: "2026-09-12T14:00:00Z" },
  { gameweek: 4, kickoff: "2026-09-13T15:30:00Z" },
];

describe("nextDeadline", () => {
  it("locks a quarter of an hour before the first kickoff", () => {
    const at = nextDeadline([P4], KICKOFFS, "2026-09-10T12:00:00Z");
    expect(at).toEqual({
      period: 4,
      at: "2026-09-12T14:00:00Z",
      locksAt: "2026-09-12T13:45:00.000Z",
    });
    expect(Date.parse(at!.at) - Date.parse(at!.locksAt)).toBe(LINEUP_LOCK_LEAD_MINUTES * 60_000);
  });

  it("does not read the period boundary as the kickoff", () => {
    // The bug this replaced. Period 4 opens Fri 11 Sep 10:00Z for a round whose
    // first match is Sat 12 Sep 14:00Z — announcing the boundary put the
    // deadline a day early, and it does that for most of the season.
    const at = nextDeadline([P4], KICKOFFS, "2026-09-10T12:00:00Z");
    expect(at?.locksAt).not.toBe("2026-09-11T09:45:00.000Z");
    expect(at?.locksAt.slice(0, 10)).toBe("2026-09-12");
  });

  it("answers the lock a manager has to beat, not the next period to open", () => {
    // Friday lunchtime, period 4 already open. The next period to OPEN is 5;
    // the deadline he actually has to beat is tomorrow afternoon's.
    expect(nextDeadline([P3, P4], KICKOFFS, "2026-09-11T12:00:00Z")?.period).toBe(4);
  });

  it("finds the next lock, not the one that has passed", () => {
    expect(nextDeadline([P3, P4], KICKOFFS, "2026-09-06T12:00:00Z")?.period).toBe(4);
  });

  it("says nothing when the season is over or the calendar is missing", () => {
    expect(nextDeadline([], KICKOFFS, "2026-09-06T12:00:00Z")).toBeNull();
    expect(nextDeadline([P3, P4], [], "2026-09-06T12:00:00Z")).toBeNull();
    expect(nextDeadline([P3, P4], KICKOFFS, "not a date")).toBeNull();
    expect(nextDeadline([P3, P4], KICKOFFS, "2026-09-20T12:00:00Z")).toBeNull();
  });
});
