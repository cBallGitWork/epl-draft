import { describe, expect, it } from "vitest";
import type { Fixture, PlayerMatchStats } from "@epl/core";
import { RETRY_DAYS, dayDone, menOwed } from "./day";

// Whether a match day's ratings are whole, over a hand-made day: one fixture, Arsenal (3) at home to Chelsea (8).

const FIXTURE = { id: 41, homeClubId: 3, awayClubId: 8 } as Fixture;
const PLAYERS = [
  { id: 1, code: 101, clubId: 3 },
  { id: 2, code: 102, clubId: 8 },
  { id: 3, code: 103, clubId: 3 },
  { id: 4, code: 104, clubId: 14 },
  { id: 5, code: 105, clubId: 8 },
];
const BRIDGED = new Set([101, 102, 103, 104]);

function row(playerId: number, minutes: number): PlayerMatchStats {
  return { playerId, fixtureId: 41, minutes } as PlayerMatchStats;
}

describe("menOwed", () => {
  it("owes a mark to each bridged man who played, at a club still on one side", () => {
    // 3 sat out, 4 has moved to Bournemouth since, 5 is not in the bridge.
    const rows = [row(1, 90), row(2, 12), row(3, 0), row(4, 90), row(5, 90)];
    expect([...menOwed([FIXTURE], rows, PLAYERS, BRIDGED)].sort()).toEqual([101, 102]);
  });

  it("owes nothing for another day's fixture", () => {
    expect(menOwed([{ ...FIXTURE, id: 42 }], [row(1, 90)], PLAYERS, BRIDGED).size).toBe(0);
  });
});

describe("dayDone", () => {
  const owed = new Set([101, 102]);

  it("records a day every owed man was marked on", () => {
    expect(dayDone(new Set([101, 102]), owed, "2026-10-10", "2026-10-11")).toBe(true);
  });

  it("leaves a short day for the next run", () => {
    expect(dayDone(new Set([101]), owed, "2026-10-10", "2026-10-11")).toBe(false);
    expect(dayDone(new Set(), owed, "2026-10-10", "2026-10-10")).toBe(false);
  });

  it(`records a short day as it stands after ${RETRY_DAYS} days of asking`, () => {
    expect(dayDone(new Set([101]), owed, "2026-10-10", "2026-10-13")).toBe(true);
  });
});
