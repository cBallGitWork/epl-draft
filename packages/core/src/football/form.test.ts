import { describe, expect, it } from "vitest";
import { formByPlayer, playedRounds } from "./form";
import type { Fixture, PlayerMatchStats } from "./types";

const row = (over: Partial<PlayerMatchStats>): PlayerMatchStats => ({
  playerId: 1, fixtureId: 1, minutes: 0, goals: 0, assists: 0, cleanSheet: false,
  goalsConceded: 0, ownGoals: 0, penaltiesSaved: 0, penaltiesMissed: 0, yellowCards: 0,
  redCards: 0, saves: 0, expectedGoals: 0,
  expectedAssists: 0, fplPoints: 0, starts: 0, ...over,
});

const fixture = (over: Partial<Fixture>): Fixture => ({
  id: 1, code: 1, gameweek: 1, homeClubId: 1, awayClubId: 2, kickoff: "2026-08-21T19:00:00Z",
  homeScore: null, awayScore: null, status: "upcoming", settled: false, minutes: 0,
  homeDifficulty: null, awayDifficulty: null, ...over,
});

describe("playedRounds", () => {
  it("takes the most recent rounds that have football in the books", () => {
    const rounds = playedRounds(
      [
        fixture({ id: 1, gameweek: 1, status: "finished" }),
        fixture({ id: 2, gameweek: 2, status: "finished" }),
        fixture({ id: 3, gameweek: 3, status: "finished" }),
        fixture({ id: 4, gameweek: 4, status: "upcoming" }),
      ],
      2,
    );
    expect(rounds).toEqual([3, 2]);
  });

  it("excludes a round still being played, whose minutes are half-counted", () => {
    const rounds = playedRounds(
      [
        fixture({ id: 1, gameweek: 1, status: "finished" }),
        fixture({ id: 2, gameweek: 2, status: "finished" }),
        fixture({ id: 3, gameweek: 2, status: "live" }),
      ],
      5,
    );
    expect(rounds).toEqual([1]);
  });

  it("keeps a round holding a postponed fixture, which never reads as finished", () => {
    // FPL leaves a rearranged match in its original round; dropping the round would shorten every denominator.
    const rounds = playedRounds(
      [
        fixture({ id: 1, gameweek: 2, status: "finished" }),
        fixture({ id: 2, gameweek: 2, status: "upcoming" }),
      ],
      5,
    );
    expect(rounds).toEqual([2]);
  });

  it("ignores a fixture FPL has filed under no round at all", () => {
    expect(playedRounds([fixture({ gameweek: null, status: "finished" })], 5)).toEqual([]);
  });
});

describe("formByPlayer", () => {
  it("counts a start, an appearance and the minutes of each round", () => {
    const form = formByPlayer([
      { gameweek: 1, stats: [row({ playerId: 7, minutes: 90, starts: 1 })] },
      { gameweek: 2, stats: [row({ playerId: 7, minutes: 62, starts: 1 })] },
    ]);
    expect(form.get(7)).toEqual({ rounds: 2, starts: 2, appearances: 2, minutes: 152 });
  });

  it("counts a round he sat out, without counting an appearance", () => {
    // FPL opens a row for every player in the league at a round's first whistle —
    // 569 of 600 on nought minutes — so a row is not an appearance.
    const form = formByPlayer([
      { gameweek: 1, stats: [row({ playerId: 7, minutes: 90, starts: 1 })] },
      { gameweek: 2, stats: [row({ playerId: 7, minutes: 0, starts: 0 })] },
    ]);
    expect(form.get(7)).toEqual({ rounds: 2, starts: 1, appearances: 1, minutes: 90 });
  });

  it("tells a substitute from a starter on the same minutes", () => {
    const form = formByPlayer([
      { gameweek: 1, stats: [row({ playerId: 7, minutes: 45, starts: 1 })] },
      { gameweek: 1, stats: [row({ playerId: 8, minutes: 45, starts: 0 })] },
    ]);
    expect(form.get(7)?.starts).toBe(1);
    expect(form.get(8)?.starts).toBe(0);
    expect(form.get(7)?.minutes).toBe(form.get(8)?.minutes);
  });

  it("does not double-count a start on a double gameweek", () => {
    // `starts` comes off the round aggregate and is written onto both fixture
    // rows, so summing the rows would report two starts for one round.
    const form = formByPlayer([
      {
        gameweek: 1,
        stats: [
          row({ playerId: 7, fixtureId: 10, minutes: 90, starts: 1 }),
          row({ playerId: 7, fixtureId: 11, minutes: 80, starts: 1 }),
        ],
      },
    ]);
    expect(form.get(7)).toEqual({ rounds: 1, starts: 1, appearances: 1, minutes: 170 });
  });

  it("has no answer for a man with no rows, rather than a nought", () => {
    // A nought would say he was available and went unpicked. He is a footballer
    // nobody has a reading for, and the screen dashes him.
    const form = formByPlayer([{ gameweek: 1, stats: [row({ playerId: 7, minutes: 90 })] }]);
    expect(form.has(99)).toBe(false);
  });

  it("gives a late arrival his own denominator", () => {
    const form = formByPlayer([
      { gameweek: 1, stats: [row({ playerId: 7, minutes: 90, starts: 1 })] },
      {
        gameweek: 2,
        stats: [
          row({ playerId: 7, minutes: 90, starts: 1 }),
          row({ playerId: 8, minutes: 90, starts: 1 }),
        ],
      },
    ]);
    expect(form.get(7)?.rounds).toBe(2);
    expect(form.get(8)?.rounds).toBe(1);
  });
});
