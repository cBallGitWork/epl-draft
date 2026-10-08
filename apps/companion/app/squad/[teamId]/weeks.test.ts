import { describe, expect, it } from "vitest";
import { periodGameweeks, type LeaguePeriod } from "@epl/core";
import { gameweekOptions, gameweekPicker, weekStanding } from "./weeks";

// The squad's gameweek picker (Craig, 1 Oct 2026): a locked week shows scores, the open and later weeks opponents.
describe("weekStanding", () => {
  const open = { gameweek: 7, period: 2 };

  it("calls a week before the open one locked, which includes the one in play", () => {
    expect(weekStanding({ gameweek: 6, period: 1 }, open)).toBe("locked");
  });

  it("calls the open week open", () => {
    expect(weekStanding({ gameweek: 7, period: 2 }, open)).toBe("open");
  });

  it("calls a later week ahead", () => {
    expect(weekStanding({ gameweek: 9, period: 4 }, open)).toBe("ahead");
  });

  it("compares periods, not gameweeks, so a double cannot misplace a week", () => {
    expect(weekStanding({ gameweek: 8, period: 2 }, open)).toBe("open");
  });

  it("knows nothing when either week is unknown", () => {
    expect(weekStanding(null, open)).toBeNull();
    expect(weekStanding({ gameweek: 6, period: 1 }, null)).toBeNull();
  });
});

describe("gameweekOptions", () => {
  it("offers each period by its gameweek, in period order, from the league's calendar alone", () => {
    const calendar = [
      { period: 2, gameweeks: [7], own: 7 },
      { period: 1, gameweeks: [6], own: 6 },
      { period: 3, gameweeks: [8], own: 8 },
    ];
    expect(gameweekOptions(calendar)).toEqual([
      { period: 1, gameweek: 6, label: "Gameweek 6" },
      { period: 2, gameweek: 7, label: "Gameweek 7" },
      { period: 3, gameweek: 8, label: "Gameweek 8" },
    ]);
  });

  it("names both gameweeks of a period that spans two, and asks for the one it is for", () => {
    expect(gameweekOptions([{ period: 30, gameweeks: [35, 36], own: 35 }])).toEqual([
      { period: 30, gameweek: 35, label: "Gameweeks 35 & 36" },
    ]);
    expect(gameweekOptions([{ period: 6, gameweeks: [3, 6], own: 6 }])).toEqual([
      { period: 6, gameweek: 6, label: "Gameweeks 3 & 6" },
    ]);
  });

  it("skips a period the calendar could not place", () => {
    expect(gameweekOptions([{ period: 1, gameweeks: [], own: null }, { period: 2, gameweeks: [7], own: 7 }])).toEqual([
      { period: 2, gameweek: 7, label: "Gameweek 7" },
    ]);
  });

  it("reaches period 6 through ?gw= when a postponed GW3 match is replayed in it", () => {
    // FPL keeps the replay in event 3 (PLATFORM_NOTES), so period 6 scores gameweeks 3 and 6.
    const periods: LeaguePeriod[] = [3, 4, 5, 6].map((n) => ({
      number: n,
      start: new Date(Date.UTC(2026, 8, 4 + 7 * (n - 3), 10)).toISOString(),
      end: new Date(Date.UTC(2026, 8, 11 + 7 * (n - 3), 9, 59, 59)).toISOString(),
    }));
    const kickoffs = [3, 4, 5, 6].map((gameweek) => ({ gameweek, kickoff: new Date(Date.UTC(2026, 8, 5 + 7 * (gameweek - 3), 14)).toISOString() }));
    const calendar = periodGameweeks(periods, [...kickoffs, { gameweek: 3, kickoff: "2026-09-30T18:30:00Z" }]);
    const option = gameweekOptions(calendar).find((each) => each.period === 6);
    expect(option).toEqual({ period: 6, gameweek: 6, label: "Gameweeks 3 & 6" });
    // `roundOf`, which `?gw=` goes through: the first period holding the gameweek.
    expect(calendar.find((each) => each.gameweeks.includes(option?.gameweek ?? -1))?.period).toBe(6);
  });
});

describe("gameweekPicker", () => {
  const calendar = [
    { period: 1, gameweeks: [6], own: 6 },
    { period: 2, gameweeks: [7, 8], own: 7 },
  ];

  it("selects the week on screen by its period, so a link to a double's second gameweek still selects it", () => {
    expect(gameweekPicker(calendar, { gameweek: 8, period: 2 })?.shown).toBe(7);
  });

  it("offers no picker for a week the calendar cannot place", () => {
    expect(gameweekPicker(calendar, null)).toBeNull();
    expect(gameweekPicker(calendar, { gameweek: 3, period: 0 })).toBeNull();
    expect(gameweekPicker([], { gameweek: 6, period: 1 })).toBeNull();
  });
});
