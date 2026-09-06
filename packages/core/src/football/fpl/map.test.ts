import { describe, expect, it } from "vitest";
import type { RawBootstrap, RawFixture, RawLive } from "./raw";
import {
  buildSnapshot,
  focusGameweek,
  mapFixtures,
  mapLiveStats,
  mapPlayers,
  roundPlayed,
} from "./map";

const bootstrap = (over: Partial<RawBootstrap> = {}): RawBootstrap => ({
  teams: [{ id: 1, code: 3, name: "Arsenal", short_name: "ARS" }],
  elements: [
    {
      id: 1, code: 154561, web_name: "Raya", first_name: "David", second_name: "Raya Martín",
      team: 1, element_type: 1, squad_number: 22, status: "a", news: "",
      chance_of_playing_next_round: null, opta_code: "p123",
      // Season totals as FPL sends them: the counts as numbers, the expected
      // trio as strings. Real figures rather than zeros, so the mapper's
      // string-to-number coercion is actually under test.
      goals_scored: 0, assists: 1, clean_sheets: 2,
      minutes: 180, starts: 2, expected_goals: "0.12", expected_assists: "0.34",
      expected_goals_conceded: "1.53",
      influence: "17.4", creativity: "5.2", threat: "0.0", tackles: 3,
      clearances_blocks_interceptions: 7, recoveries: 19, saves: 8,
      goals_conceded: 2, bonus: 1, bps: 45,
    },
  ],
  events: [
    { id: 1, name: "Gameweek 1", deadline_time: "2026-08-21T17:30:00Z", finished: true, data_checked: true, is_current: false, is_next: false, is_previous: true },
    { id: 2, name: "Gameweek 2", deadline_time: "2026-08-28T17:30:00Z", finished: false, data_checked: false, is_current: false, is_next: true, is_previous: false },
  ],
  ...over,
});

const fixture = (over: Partial<RawFixture> = {}): RawFixture => ({
  id: 1, code: 1, event: 1, kickoff_time: "2026-08-21T19:00:00Z", started: false, finished: false,
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

  it("keeps bonus apart from the whistle, which `status` throws away", () => {
    const provisional = mapFixtures([
      fixture({ started: true, finished: false, finished_provisional: true }),
    ])[0];
    expect(provisional.status).toBe("finished");
    expect(provisional.settled).toBe(false);

    const settled = mapFixtures([
      fixture({ started: true, finished: true, finished_provisional: true }),
    ])[0];
    expect(settled.settled).toBe(true);
  });
});

describe("mapPlayers", () => {
  it("keeps the stable portrait code and joins the full name", () => {
    const [p] = mapPlayers(bootstrap());
    expect(p.code).toBe(154561);
    expect(p.fullName).toBe("David Raya Martín");
  });

  it("carries the three the competition itself counts", () => {
    // Nought is a real reading here and not an absence: a keeper who has scored
    // no goals has scored none. What is under test is that the three arrive at
    // all — they were deliberately dropped until 2 Sep 2026.
    const [p] = mapPlayers(bootstrap());
    expect(p.season.goals).toBe(0);
    expect(p.season.assists).toBe(1);
    expect(p.season.cleanSheets).toBe(2);
  });

  // element_type is FPL's fantasy classification, not a property of the footballer.
  // Fantrax files the same player differently and allows several positions at once,
  // so it stays in raw.ts and never reaches a domain type.
  it("reads the season totals, with the expected trio parsed off strings", () => {
    const [p] = mapPlayers(bootstrap());
    expect(p.season.minutes).toBe(180);
    expect(p.season.starts).toBe(2);
    // FPL serialises its decimals as strings and its counts as numbers; both
    // arrive here as numbers or the columns built on them cannot be sorted.
    expect(p.season.expectedGoals).toBeCloseTo(0.12);
    expect(p.season.expectedAssists).toBeCloseTo(0.34);
    expect(p.season.expectedGoalsConceded).toBeCloseTo(1.53);
    expect(p.season.tackles).toBe(3);
    expect(p.season.clearancesBlocksInterceptions).toBe(7);
    expect(p.season.recoveries).toBe(19);
    expect(p.season.bps).toBe(45);
  });

  it("reads a missing total as nought rather than as absent", () => {
    // Scraped data on a payload we do not control. A player FPL says nothing
    // about has done nothing, which is a fact rather than a hole.
    const [p] = mapPlayers(
      bootstrap({
        elements: [
          { ...bootstrap().elements[0], minutes: undefined as unknown as number },
        ],
      }),
    );
    expect(p.season.minutes).toBe(0);
  });

  it("does not carry a position", () => {
    const [p] = mapPlayers(bootstrap());
    expect(p).not.toHaveProperty("position");
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

  it("carries `starts` off the aggregate, and repeats it on a double", () => {
    // `explain` covers point-scoring identifiers only and a start scores nothing
    // by itself, so this can only come off the round aggregate — which means it
    // is the ROUND's count written onto every fixture row. A caller summing the
    // rows of one round would report two starts for one appearance.
    const rows = mapLiveStats({
      elements: [
        {
          id: 1,
          stats: { minutes: 135, starts: 1, bps: 60 },
          explain: [
            { fixture: 10, stats: [{ identifier: "minutes", points: 2, value: 90 }] },
            { fixture: 11, stats: [{ identifier: "minutes", points: 1, value: 45 }] },
          ],
        },
      ],
    });
    expect(rows.map((r) => r.starts)).toEqual([1, 1]);
  });

  it("reads a substitute's nought rather than inferring one from minutes", () => {
    // 45 minutes off the bench and 45 minutes of a start are the same number and
    // different men, which is the whole reason this field is mapped instead of
    // being derived from a minutes threshold.
    const rows = mapLiveStats({
      elements: [{ id: 2, stats: { minutes: 45, starts: 0 }, explain: [{ fixture: 10, stats: [] }] }],
    });
    expect(rows[0]).toMatchObject({ minutes: 45, starts: 0 });
  });
});

describe("buildSnapshot", () => {
  it("assembles the layers and carries the injected timestamp", () => {
    const snap = buildSnapshot({
      bootstrap: bootstrap(), fixtures: [fixture()], live: { elements: [] },
      gameweek: 2, fetchedAt: "2026-08-21T18:00:00Z",
    });
    expect(snap.clubs).toHaveLength(1);
    expect(snap.players).toHaveLength(1);
    expect(snap.gameweek).toBe(2);
    expect(snap.fetchedAt).toBe("2026-08-21T18:00:00Z");
  });

  it("tells an empty live read apart from one that failed", () => {
    // Both give no stats and on a Saturday they mean opposite things: FPL says
    // `{elements: []}` before the first kickoff, and a read that fell over says
    // nothing at all. Rendering every player on nought is only honest for one
    // of them.
    const quiet = buildSnapshot({
      bootstrap: bootstrap(), fixtures: [fixture()], live: { elements: [] },
      gameweek: 2, fetchedAt: "2026-08-21T18:00:00Z",
    });
    const blind = buildSnapshot({
      bootstrap: bootstrap(), fixtures: [fixture()], live: null,
      gameweek: 2, fetchedAt: "2026-08-21T18:00:00Z",
    });
    expect(quiet.stats).toEqual([]);
    expect(quiet.statsUnavailable).toBe(false);
    expect(blind.stats).toEqual([]);
    expect(blind.statsUnavailable).toBe(true);
  });

  it("labels the snapshot with the round asked for, not the one in play", () => {
    // Viewing GW1 while GW2 is next used to return GW1's fixtures under GW2's
    // number and deadline. Invisible until something could request a round other
    // than the current one, which is exactly what gameweek navigation does.
    const snap = buildSnapshot({
      bootstrap: bootstrap(), fixtures: [fixture()], live: { elements: [] },
      gameweek: 1, fetchedAt: "2026-08-21T18:00:00Z",
    });
    expect(snap.gameweek).toBe(1);
    expect(snap.deadline).toBe("2026-08-21T17:30:00Z");
  });

  it("carries the season's gameweeks so navigation need not assume 38", () => {
    const snap = buildSnapshot({
      bootstrap: bootstrap(), fixtures: [], live: { elements: [] },
      gameweek: 1, fetchedAt: "2026-08-21T18:00:00Z",
    });
    expect(snap.gameweeks).toEqual([1, 2]);
  });

  it("carries FPL's sign-off on the round it was asked for", () => {
    const round = (gameweek: number) =>
      buildSnapshot({
        bootstrap: bootstrap(), fixtures: [fixture()], live: { elements: [] },
        gameweek, fetchedAt: "2026-08-24T09:00:00Z",
      }).dataChecked;
    expect(round(1)).toBe(true);
    expect(round(2)).toBe(false);
  });

  it("does not read a missing sign-off as a signed-off round", () => {
    // Scraped data: the field going absent must not read as FPL saying yes, or
    // an unlisted round prints "Final" over football nobody has played.
    const unsigned = buildSnapshot({
      bootstrap: bootstrap({ events: [] }), fixtures: [fixture()], live: { elements: [] },
      gameweek: 1, fetchedAt: "2026-08-24T09:00:00Z",
    });
    expect(unsigned.dataChecked).toBe(false);
  });

  it("has no deadline for a round FPL does not list", () => {
    const snap = buildSnapshot({
      bootstrap: bootstrap(), fixtures: [], live: { elements: [] },
      gameweek: 99, fetchedAt: "2026-08-21T18:00:00Z",
    });
    expect(snap.deadline).toBeNull();
  });
});

describe("roundPlayed", () => {
  // The three states one bootstrap holds at once, counted live on 5 Sep 2026
  // with GW3 in play: a played round, the round being played, and the round
  // whose deadline is next.
  const events = {
    events: [
      { id: 1, is_current: false, is_next: false, finished: true },
      { id: 3, is_current: true, is_next: false, finished: false },
      { id: 4, is_current: false, is_next: true, finished: false },
    ],
  } as unknown as RawBootstrap;

  it("answers about the FOOTBALL, not about the deadline", () => {
    expect(roundPlayed(events, 1)).toBe(true);
    // The one that matters: GW3's football is still being played while FPL has
    // already moved `is_next` to 4, because its deadline has passed. A check
    // reading `is_next` calls Saturday's own prediction wrong every week.
    expect(roundPlayed(events, 3)).toBe(false);
    expect(roundPlayed(events, 4)).toBe(false);
  });

  it("is null for a round FPL does not list", () => {
    // Not false: "we have no idea" and "it has not been played" are different
    // answers, and only one of them should fail a freshness check.
    expect(roundPlayed(events, 39)).toBeNull();
    expect(roundPlayed({ events: [] } as unknown as RawBootstrap, 1)).toBeNull();
  });
});
