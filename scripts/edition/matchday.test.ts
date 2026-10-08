import { describe, expect, it } from "vitest";
import type { PlayerMatchStats } from "@epl/core";
import { seasonLines } from "./matchday";

const row = (playerId: number, starts: number, goals: number): PlayerMatchStats => ({
  playerId, fixtureId: 1, minutes: 90, goals, assists: 0, cleanSheet: false, goalsConceded: 0, ownGoals: 0, penaltiesSaved: 0,
  penaltiesMissed: 0, yellowCards: 0, redCards: 0, saves: 0, expectedGoals: 0, expectedAssists: 0, starts, fplPoints: 0,
});
const snapshot = { players: [{ id: 7, code: 700 }], stats: [row(7, 1, 1)] };

describe("seasonLines", () => {
  it("counts a man's starts and goals over every past gameweek, and this one's goals, by code", () => {
    expect(seasonLines([[row(7, 1, 2)], [row(7, 0, 0)]], snapshot)?.get(700)).toEqual({ startsBefore: 1, matchesBefore: 0, yellowsBefore: 0, goalsSeason: 3 });
  });

  it("tells nobody's season when a past gameweek would not load", () => {
    expect(seasonLines([[row(7, 1, 2)], null], snapshot)).toBeNull();
  });
});
