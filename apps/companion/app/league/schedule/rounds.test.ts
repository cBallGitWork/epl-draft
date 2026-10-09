import { describe, expect, it } from "vitest";
import type { Fixture, LeagueInfo, LeaguePeriod } from "@epl/core";
import { scheduleRounds } from "./rounds";

/** Weekly periods from Friday 4 Sep 2026, each to the next Friday morning. */
const periods = (count: number): LeaguePeriod[] =>
  Array.from({ length: count }, (_, at) => ({
    number: at + 1,
    start: new Date(Date.UTC(2026, 8, 4 + 7 * at, 10)).toISOString(),
    end: new Date(Date.UTC(2026, 8, 11 + 7 * at, 9, 59, 59)).toISOString(),
  }));

/** A Saturday match in a period's week, filed under a gameweek. */
const match = (gameweek: number, week: number, id = gameweek * 100 + week): Fixture => ({
  id, code: id, gameweek, homeClubId: 1, awayClubId: 2,
  kickoff: new Date(Date.UTC(2026, 8, 5 + 7 * (week - 1), 14)).toISOString(),
  homeScore: null, awayScore: null, status: "upcoming", settled: false, minutes: 0,
  homeDifficulty: null, awayDifficulty: null,
});

/** Each gameweek's matches in its own week, `extra` added. */
const season = (gameweeks: number, extra: Fixture[] = []): Fixture[] => [
  ...Array.from({ length: gameweeks }, (_, at) => [match(at + 1, at + 1), match(at + 1, at + 1, 9000 + at)]).flat(),
  ...extra,
];

const info = (scoringPeriods: LeaguePeriod[]) => ({ scoringPeriods, rosterPeriods: [] }) as unknown as LeagueInfo;

const shape = (rounds: { gameweek: number; period: number }[]) =>
  rounds.map(({ gameweek, period }) => ({ gameweek, period }));

describe("scheduleRounds", () => {
  it("is one round a period when each holds its own gameweek", () => {
    expect(shape(scheduleRounds(info(periods(3)), season(3)))).toEqual([
      { gameweek: 1, period: 1 },
      { gameweek: 2, period: 2 },
      { gameweek: 3, period: 3 },
    ]);
  });

  it("keeps a period that holds two gameweeks to one round, so its ties are listed once", () => {
    // Gameweek 2 played midweek inside period 1's week; period 2 holds gameweek 3.
    const fixtures = [match(1, 1), match(1, 1, 7), match(2, 1), match(3, 2)];
    const rounds = scheduleRounds(info(periods(2)), fixtures);
    expect(rounds.map((round) => round.period)).toEqual([1, 2]);
    expect(shape(rounds)[0]).toEqual({ gameweek: 1, period: 1 });
  });

  it("leaves a gameweek in its own period when one of its matches is brought forward", () => {
    // A gameweek 3 match played in period 1's week: period 1 holds gameweeks 1 and 3.
    expect(shape(scheduleRounds(info(periods(3)), season(3, [match(3, 1)])))).toEqual([
      { gameweek: 1, period: 1 },
      { gameweek: 2, period: 2 },
      { gameweek: 3, period: 3 },
    ]);
  });

  it("leaves a gameweek in its own period when one of its matches is replayed later", () => {
    expect(shape(scheduleRounds(info(periods(3)), season(3, [match(1, 3)])))).toEqual([
      { gameweek: 1, period: 1 },
      { gameweek: 2, period: 2 },
      { gameweek: 3, period: 3 },
    ]);
  });
});
