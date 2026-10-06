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

  it("counts the clean sheets he kept, one per match, alongside what he conceded", () => {
    const double = contribution([
      appearance({ fixtureId: 1, cleanSheet: true }),
      appearance({ fixtureId: 2, cleanSheet: false, goalsConceded: 2, ownGoals: 1 }),
    ]);
    expect(double).toMatchObject({ cleanSheet: false, cleanSheets: 1, goalsConceded: 2, ownGoals: 1 });
  });

  it("credits no clean sheet to a match he has not played", () => {
    expect(contribution([appearance({ minutes: 0, cleanSheet: true })]).cleanSheets).toBe(0);
  });

  it("adds a penalty missed in each half of a double up", () => {
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
