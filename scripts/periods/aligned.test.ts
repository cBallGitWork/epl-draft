import { describe, expect, it } from "vitest";
import { periodGameweeks, type GameweekKickoff, type LeaguePeriod } from "@epl/core";
import { holdsOnlyItsOwn } from "./aligned";

// period-alignment's verdict over periods and kickoffs written here: no network.

/** A week of the real league's calendar, numbered as the league numbers it. */
const week = (number: number): LeaguePeriod => ({ number, start: "2026-10-09T06:00:00.0-0400", end: "2026-10-16T05:59:59.0-0400" });
const GW6: GameweekKickoff[] = ["2026-10-10T11:30:00Z", "2026-10-11T15:30:00Z"].map((kickoff) => ({ gameweek: 6, kickoff }));
const aligned = (number: number, kickoffs: GameweekKickoff[]) => periodGameweeks([week(number)], kickoffs).map(holdsOnlyItsOwn)[0];

describe("holdsOnlyItsOwn", () => {
  it("passes a period holding one gameweek", () => {
    expect(aligned(6, GW6)).toBe(true);
  });

  it("fails a period a replayed match has given a second gameweek", () => {
    expect(aligned(6, [...GW6, { gameweek: 3, kickoff: "2026-10-14T18:30:00Z" }])).toBe(false);
  });

  it("fails a blank period", () => {
    expect(aligned(6, [])).toBe(false);
  });

  it("passes a league whose periods are not numbered as FPL's gameweeks", () => {
    expect(aligned(1, GW6)).toBe(true);
  });
});
