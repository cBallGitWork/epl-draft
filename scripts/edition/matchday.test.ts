import { describe, expect, it, vi } from "vitest";
import type { FootballSnapshot, PlayerMatchStats } from "@epl/core";
import { fixture } from "../../packages/core/src/gazette/reports/__fixtures__/spursVilla";
import type { DeskFacts } from "./facts";
import { matchdayInput, seasonLines } from "./matchday";

vi.mock("@epl/core", async (actual) => ({
  ...(await actual<typeof import("@epl/core")>()),
  fetchFixtures: () => Promise.reject(new Error("refused")),
  fetchPlRound: () => Promise.reject(new Error("refused")),
}));

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

describe("matchdayInput", () => {
  it("files no report when FPL will not give the season's fixtures, which the table is read from", async () => {
    const said: string[] = [];
    const day: FootballSnapshot = {
      clubs: [], players: [], fixtures: [fixture], stats: [], gameweek: 5, deadline: null, gameweeks: [5],
      fetchedAt: "2026-09-20T09:00:00Z", dataChecked: true, statsUnavailable: false,
    };
    // Facts are read only after the season and the round.
    expect(await matchdayInput({ snapshot: day, facts: {} as DeskFacts, periodGameweeks: [5], pick: () => true, say: (m) => said.push(m) })).toBeNull();
    expect(said).toEqual(["FPL would not give the season's fixtures, which the table is read from."]);
  });
});
