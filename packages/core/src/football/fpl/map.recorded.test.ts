import { describe, expect, it } from "vitest";
import { buildSnapshot, focusGameweek, mapLiveStats, mapPlayers, roundPlayed } from "./map";
import type { RawBootstrap, RawLive } from "./raw";
import recordedBootstrap from "./__fixtures__/bootstrap.json";
import recordedLive from "./__fixtures__/liveGw5.json";

// FPL's bootstrap and GW5 live payloads, recorded 25 Sep 2026 with GW5 current and finished:
// every club and round, 25 men chosen to carry each position and status, every key intact.

const bootstrap = recordedBootstrap as RawBootstrap;
// Through `unknown`: `RawLiveElement.stats` has no booleans, and FPL also sends `in_dreamteam` and `played`.
const live = recordedLive as unknown as RawLive;
const players = mapPlayers(bootstrap);
const stats = mapLiveStats(live);

const CODE = {
  haaland: 223094,
  garcia: 606798,
  saliba: 462424,
  fatawu: 531442,
  martinez: 221820,
  tzolakis: 473284,
  wissa: 216646,
  buendia: 195546,
  arrizabalaga: 109745,
} as const;

/** A recorded man by his season-stable `code`, so no test leans on this season's ids. */
const byCode = (code: number) => {
  const player = players.find((p) => p.code === code);
  if (!player) throw new Error(`no element with code ${code} in the fixture`);
  return player;
};
const lineOf = (code: number) => stats.find((row) => row.playerId === byCode(code).id);

describe("mapPlayers on a recorded bootstrap", () => {
  it("maps every element, across all four positions and all five statuses", () => {
    expect(players).toHaveLength(25);
    expect(new Set(bootstrap.elements.map((e) => e.element_type))).toEqual(new Set([1, 2, 3, 4]));
    expect(new Set(players.map((p) => p.status))).toEqual(new Set(["a", "d", "i", "s", "u"]));
  });

  it("reads Haaland's line as FPL filed it, the decimal strings as numbers", () => {
    expect(byCode(CODE.haaland)).toMatchObject({
      name: "Haaland",
      fullName: "Erling Haaland",
      clubId: 15,
      status: "a",
      news: "",
      optaCode: "p223094",
      birthDate: "2000-07-21",
      region: 161,
      season: {
        goals: 5,
        assists: 0,
        cleanSheets: 2,
        minutes: 450,
        starts: 5,
        expectedGoals: 4.42,
        expectedAssists: 0.53,
        expectedGoalsConceded: 7.25,
        influence: 184.2,
        creativity: 22.5,
        threat: 258,
        clearancesBlocksInterceptions: 10,
        recoveries: 10,
        goalsConceded: 5,
        bonus: 9,
        bps: 167,
      },
    });
  });

  it("leaves what FPL did not file as null, never nought", () => {
    expect(byCode(CODE.garcia)).toMatchObject({ birthDate: null, region: null });
    expect(byCode(CODE.haaland)).toMatchObject({ newsAdded: null, chanceOfPlaying: null });
  });

  it("keeps a nought FPL did file", () => {
    expect(byCode(CODE.saliba)).toMatchObject({
      status: "i",
      chanceOfPlaying: 0,
      news: "Back injury - Unknown return date",
      newsAdded: "2026-07-23T12:01:23.289376Z",
    });
  });
});

describe("the recorded round calendar", () => {
  it("focuses the round in play, with its own deadline", () => {
    expect(bootstrap.teams).toHaveLength(20);
    expect(bootstrap.events).toHaveLength(38);
    expect(focusGameweek(bootstrap)).toEqual({ gameweek: 5, deadline: "2026-09-18T17:30:00Z" });
  });

  it("says a played round was played, a coming one was not, and knows no 39th", () => {
    expect(roundPlayed(bootstrap, 5)).toBe(true);
    expect(roundPlayed(bootstrap, 6)).toBe(false);
    expect(roundPlayed(bootstrap, 38)).toBe(false);
    expect(roundPlayed(bootstrap, 39)).toBeNull();
  });
});

describe("mapLiveStats on recorded GW5", () => {
  it("writes one row per man, since nobody played twice", () => {
    expect(stats).toHaveLength(25);
    expect(new Set(stats.map((row) => row.playerId)).size).toBe(25);
  });

  it("reads Haaland's match, taking what `explain` omits from the aggregate", () => {
    expect(lineOf(CODE.haaland)).toMatchObject({
      fixtureId: 45,
      minutes: 90,
      goals: 1,
      assists: 0,
      cleanSheet: false,
      goalsConceded: 3,
      bps: 25,
      defensiveContribution: 2,
      expectedGoals: 1.09,
      expectedAssists: 0.02,
      starts: 1,
      fplPoints: 6,
    });
  });

  it("adds `explain` up to FPL's own total for every man", () => {
    for (const element of live.elements) {
      const row = stats.find((line) => line.playerId === element.id);
      expect(row?.fplPoints).toBe(element.stats.total_points);
    }
  });

  it("carries the rare events a round threw up", () => {
    expect(lineOf(CODE.fatawu)).toMatchObject({ redCards: 1, minutes: 66 });
    expect(lineOf(CODE.martinez)).toMatchObject({ ownGoals: 1 });
    expect(lineOf(CODE.tzolakis)).toMatchObject({ penaltiesSaved: 1, yellowCards: 1, saves: 3 });
    expect(lineOf(CODE.wissa)).toMatchObject({ penaltiesMissed: 1 });
    expect(lineOf(CODE.buendia)).toMatchObject({ goals: 1, bonus: 3, defensiveContribution: 15 });
  });

  it("gives an unused substitute his noughts", () => {
    expect(lineOf(CODE.arrizabalaga)).toMatchObject({ minutes: 0, starts: 0, fplPoints: 0 });
  });
});

describe("buildSnapshot on the recorded pair", () => {
  it("labels the round from its own event", () => {
    const snapshot = buildSnapshot({
      bootstrap,
      fixtures: [],
      live,
      gameweek: 5,
      fetchedAt: "2026-09-25T12:00:00Z",
    });
    expect(snapshot).toMatchObject({
      gameweek: 5,
      deadline: "2026-09-18T17:30:00Z",
      dataChecked: true,
      statsUnavailable: false,
    });
    expect(snapshot.clubs).toHaveLength(20);
    expect(snapshot.gameweeks).toEqual(Array.from({ length: 38 }, (_, i) => i + 1));
    expect(snapshot.stats).toHaveLength(25);
  });
});
