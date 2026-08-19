import { describe, expect, it } from "vitest";
import { contribution } from "./contribution";
import type { PlayerMatchStats } from "../football/types";

const appearance = (fill: Partial<PlayerMatchStats>): PlayerMatchStats => ({
  playerId: 1,
  fixtureId: 1,
  minutes: 90,
  goals: 0,
  assists: 0,
  cleanSheet: false,
  goalsConceded: 0,
  ownGoals: 0,
  penaltiesSaved: 0,
  penaltiesMissed: 0,
  yellowCards: 0,
  redCards: 0,
  saves: 0,
  bonus: 0,
  bps: 0,
  defensiveContribution: 0,
  expectedGoals: 0,
  expectedAssists: 0,
  ...fill,
});

describe("contribution", () => {
  it("says nothing happened rather than nothing was played", () => {
    // The state of every squad most of every week. `played` is what the views
    // branch on, because a man on nought minutes and a man who has not kicked
    // off are different things and only one of them has a fixture to print.
    expect(contribution([])).toMatchObject({ played: false, minutes: 0, goals: 0 });
  });

  it("adds a double gameweek up rather than reporting one half of it", () => {
    const both = contribution([
      appearance({ fixtureId: 1, minutes: 90, goals: 1, saves: 2 }),
      appearance({ fixtureId: 2, minutes: 63, goals: 2, saves: 3 }),
    ]);
    expect(both).toMatchObject({ played: true, minutes: 153, goals: 3, saves: 5 });
  });

  it("only calls it a clean sheet when he kept one in every match he played", () => {
    expect(contribution([appearance({ cleanSheet: true })]).cleanSheet).toBe(true);
    expect(
      contribution([
        appearance({ fixtureId: 1, cleanSheet: true }),
        appearance({ fixtureId: 2, cleanSheet: false }),
      ]).cleanSheet,
    ).toBe(false);
  });

  it("does not report a clean sheet for a man who has not played", () => {
    // `every` on an empty list is true, which would credit fifteen players with
    // a clean sheet apiece before a ball was kicked.
    expect(contribution([]).cleanSheet).toBe(false);
  });

  it("carries a booking in each half of a double as two", () => {
    const booked = contribution([
      appearance({ fixtureId: 1, yellowCards: 1 }),
      appearance({ fixtureId: 2, yellowCards: 1, redCards: 1 }),
    ]);
    expect(booked).toMatchObject({ yellowCards: 2, redCards: 1 });
  });
});
