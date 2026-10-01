import { describe, expect, it } from "vitest";
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
      { period: 2, gameweeks: [7] },
      { period: 1, gameweeks: [6] },
      { period: 3, gameweeks: [8] },
    ];
    expect(gameweekOptions(calendar)).toEqual([
      { period: 1, gameweek: 6, label: "Gameweek 6" },
      { period: 2, gameweek: 7, label: "Gameweek 7" },
      { period: 3, gameweek: 8, label: "Gameweek 8" },
    ]);
  });

  it("names both gameweeks of a period that spans two, and asks for its first", () => {
    expect(gameweekOptions([{ period: 30, gameweeks: [35, 36] }])).toEqual([
      { period: 30, gameweek: 35, label: "Gameweeks 35 & 36" },
    ]);
  });

  it("skips a period the calendar could not place", () => {
    expect(gameweekOptions([{ period: 1, gameweeks: [] }, { period: 2, gameweeks: [7] }])).toEqual([
      { period: 2, gameweek: 7, label: "Gameweek 7" },
    ]);
  });
});

describe("gameweekPicker", () => {
  const calendar = [
    { period: 1, gameweeks: [6] },
    { period: 2, gameweeks: [7, 8] },
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
