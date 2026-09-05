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
  expectedAssists: 0, fplPoints: 0, starts: 1,
  ...fill,
});

describe("contribution", () => {
  it("says nothing happened, for a man with no stat line at all", () => {
    expect(contribution([])).toMatchObject({ minutes: 0, goals: 0, cleanSheet: false });
  });

  it("reads a not-yet-kicked-off row as nothing, not as a goalless appearance", () => {
    // FPL emits a zero row for every player in the league from a round's first
    // whistle, including men whose fixture is three days away. Summing it is
    // harmless; treating it as evidence about him is not.
    expect(contribution([appearance({ minutes: 0 })])).toMatchObject({
      minutes: 0,
      cleanSheet: false,
    });
  });

  it("adds a double gameweek up rather than reporting one half of it", () => {
    const both = contribution([
      appearance({ fixtureId: 1, minutes: 90, goals: 1, saves: 2 }),
      appearance({ fixtureId: 2, minutes: 63, goals: 2, saves: 3 }),
    ]);
    expect(both).toMatchObject({ minutes: 153, goals: 3, saves: 5 });
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

  it("keeps a clean sheet a man earned when his other match has not kicked off", () => {
    // The double-gameweek trap. His Saturday was a clean sheet; his Tuesday has
    // not been played, and FPL is already carrying a zero row for it. Counting
    // that row as a match he failed to keep one in takes Saturday away from him.
    expect(
      contribution([
        appearance({ fixtureId: 1, minutes: 90, cleanSheet: true }),
        appearance({ fixtureId: 2, minutes: 0, cleanSheet: false }),
      ]).cleanSheet,
    ).toBe(true);
  });

  it("does not report a clean sheet for a man who has not played", () => {
    // `every` on an empty list is true, which would credit fifteen players with
    // a clean sheet apiece before a ball was kicked.
    expect(contribution([]).cleanSheet).toBe(false);
  });

  it("has no measurements at all for a man who has not been on a pitch", () => {
    // FPL opens a zero row for every player in the league at the round's first
    // whistle. Nought expected goals for a man whose match is on Tuesday is a
    // measurement nobody took, and it must not read as a poor afternoon.
    expect(contribution([]).measured).toBeNull();
    expect(contribution([appearance({ minutes: 0, bps: 0 })]).measured).toBeNull();
  });

  it("reads the round's measurements rather than adding them up", () => {
    // `mapLiveStats` copies the gameweek aggregate onto every fixture row a
    // player has, because FPL's `explain` block carries only point-scoring
    // identifiers. Summing two rows of a double reports the round twice.
    const double = contribution([
      appearance({ fixtureId: 1, bps: 41, expectedGoals: 0.7, defensiveContribution: 9 }),
      appearance({ fixtureId: 2, bps: 41, expectedGoals: 0.7, defensiveContribution: 9 }),
    ]);
    expect(double.measured).toEqual({
      bps: 41,
      defensiveContribution: 9,
      expectedGoals: 0.7,
      expectedAssists: 0,
    });
  });

  it("takes the measurements off a match he played, not off one he has not", () => {
    // The zero row sorts first here. Reading it would report a round he had a
    // goal in as nought bps.
    const mixed = contribution([
      appearance({ fixtureId: 2, minutes: 0, bps: 0, expectedGoals: 0 }),
      appearance({ fixtureId: 1, minutes: 90, bps: 33, expectedGoals: 0.45 }),
    ]);
    expect(mixed.measured).toMatchObject({ bps: 33, expectedGoals: 0.45 });
  });

  it("adds a penalty missed in each half of a double up", () => {
    // Per-fixture in FPL's `explain`, unlike the four above, so these do sum.
    const pens = contribution([
      appearance({ fixtureId: 1, penaltiesMissed: 1 }),
      appearance({ fixtureId: 2, penaltiesMissed: 1, penaltiesSaved: 2 }),
    ]);
    expect(pens).toMatchObject({ penaltiesMissed: 2, penaltiesSaved: 2 });
  });

  it("carries a booking in each half of a double as two", () => {
    const booked = contribution([
      appearance({ fixtureId: 1, yellowCards: 1 }),
      appearance({ fixtureId: 2, yellowCards: 1, redCards: 1 }),
    ]);
    expect(booked).toMatchObject({ yellowCards: 2, redCards: 1 });
  });
});
