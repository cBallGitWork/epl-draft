import { describe, expect, it } from "vitest";
import type { RawBootstrap, RawFixture, RawLive } from "./raw";
import { buildSnapshot, focusGameweek, mapFixtures, mapLiveStats, mapPlayers } from "./map";

const bootstrap = (over: Partial<RawBootstrap> = {}): RawBootstrap => ({
  teams: [{ id: 1, code: 3, name: "Arsenal", short_name: "ARS" }],
  elements: [
    {
      id: 1, code: 154561, web_name: "Raya", first_name: "David", second_name: "Raya Martín",
      team: 1, element_type: 1, squad_number: 22, status: "a", news: "",
      chance_of_playing_next_round: null, opta_code: "p123",
    },
  ],
  events: [
    { id: 1, name: "Gameweek 1", deadline_time: "2026-08-21T17:30:00Z", finished: true, is_current: false, is_next: false, is_previous: true },
    { id: 2, name: "Gameweek 2", deadline_time: "2026-08-28T17:30:00Z", finished: false, is_current: false, is_next: true, is_previous: false },
  ],
  ...over,
});

const fixture = (over: Partial<RawFixture> = {}): RawFixture => ({
  id: 1, event: 1, kickoff_time: "2026-08-21T19:00:00Z", started: false, finished: false,
  finished_provisional: false, minutes: 0, team_h: 1, team_a: 7, team_h_score: null,
  team_a_score: null, ...over,
});

describe("focusGameweek", () => {
  it("prefers the gameweek in play", () => {
    const raw = bootstrap();
    raw.events[1].is_current = true;
    expect(focusGameweek(raw).gameweek).toBe(2);
  });

  it("falls back to the next gameweek between rounds", () => {
    expect(focusGameweek(bootstrap())).toEqual({ gameweek: 2, deadline: "2026-08-28T17:30:00Z" });
  });

  it("still returns a gameweek when the events list is empty", () => {
    // Defensive: FPL wipes events briefly at season rollover, and a blank page is
    // a worse failure than showing gameweek 1.
    expect(focusGameweek(bootstrap({ events: [] })).gameweek).toBe(1);
  });
});

describe("mapFixtures", () => {
  it("reads a fixture as finished once the referee blows up, before bonus settles", () => {
    const [f] = mapFixtures([fixture({ started: true, finished: false, finished_provisional: true })]);
    expect(f.status).toBe("finished");
  });

  it("distinguishes live from upcoming", () => {
    expect(mapFixtures([fixture({ started: true })])[0].status).toBe("live");
    expect(mapFixtures([fixture()])[0].status).toBe("upcoming");
  });
});

describe("mapPlayers", () => {
  it("maps element_type to a position and keeps the stable portrait code", () => {
    const [p] = mapPlayers(bootstrap());
    expect(p.position).toBe("GK");
    expect(p.code).toBe(154561);
    expect(p.fullName).toBe("David Raya Martín");
  });
});

describe("mapLiveStats", () => {
  const live = (explain: RawLive["elements"][0]["explain"]): RawLive => ({
    elements: [{ id: 1, stats: { minutes: 135, goals_scored: 3, bps: 60 }, explain }],
  });

  it("attributes a single fixture's stats from the aggregate", () => {
    const rows = mapLiveStats(live([{ fixture: 10, stats: [{ identifier: "goals_scored", points: 24, value: 2 }] }]));
    expect(rows).toHaveLength(1);
    // `explain` wins where present, aggregate fills the rest on a single fixture.
    expect(rows[0]).toMatchObject({ fixtureId: 10, goals: 2, minutes: 135 });
  });

  it("splits a double gameweek per fixture rather than double-counting", () => {
    const rows = mapLiveStats(live([
      { fixture: 10, stats: [{ identifier: "goals_scored", points: 12, value: 1 }, { identifier: "minutes", points: 2, value: 90 }] },
      { fixture: 11, stats: [{ identifier: "goals_scored", points: 24, value: 2 }, { identifier: "minutes", points: 2, value: 45 }] },
    ]));
    expect(rows.map((r) => r.goals)).toEqual([1, 2]);
    expect(rows.map((r) => r.minutes)).toEqual([90, 45]);
    // The aggregate must NOT leak into either row on a double.
    expect(rows.every((r) => r.minutes !== 135)).toBe(true);
  });

  it("returns nothing before the first kickoff", () => {
    expect(mapLiveStats({ elements: [] })).toEqual([]);
  });
});

describe("buildSnapshot", () => {
  it("assembles the layers and carries the injected timestamp", () => {
    const snap = buildSnapshot({
      bootstrap: bootstrap(), fixtures: [fixture()], live: { elements: [] },
      fetchedAt: "2026-08-21T18:00:00Z",
    });
    expect(snap.clubs).toHaveLength(1);
    expect(snap.players).toHaveLength(1);
    expect(snap.gameweek).toBe(2);
    expect(snap.fetchedAt).toBe("2026-08-21T18:00:00Z");
  });
});
