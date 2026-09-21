import { describe, expect, it } from "vitest";
import type { Fixture, FootballPlayer, FootballSnapshot, MatchEvent } from "./types";
import { before, rewindRound, roundAt } from "./replay";

const KICKOFF = Date.parse("2026-09-19T14:00:00Z");

const player = (code: number, clubId: number): FootballPlayer =>
  ({ code, clubId }) as FootballPlayer;

const fixture = (over: Partial<Fixture> & { id: number }): Fixture => ({
  code: 100, gameweek: 5, homeClubId: 1, awayClubId: 2, kickoff: "2026-09-19T14:00:00Z",
  homeScore: 2, awayScore: 1, status: "finished", settled: true, minutes: 90,
  homeDifficulty: null, awayDifficulty: null, ...over,
});

const goal = (over: Partial<MatchEvent> = {}): MatchEvent => ({
  id: 1, fixtureCode: 100, kind: "goal", minute: "10", seconds: 600,
  absolute: KICKOFF + 10 * 60_000, text: "", players: [10, null], ...over,
});

const snap = (fixtures: Fixture[]): FootballSnapshot =>
  ({
    clubs: [], players: [player(10, 1), player(20, 2)], fixtures, stats: [],
    gameweek: 5, deadline: null, gameweeks: [5], fetchedAt: "2026-09-21T13:00:00Z",
    dataChecked: true, statsUnavailable: false,
  });

const at = (minutesIn: number) => new Date(KICKOFF + minutesIn * 60_000).toISOString();

describe("roundAt", () => {
  const season = [
    fixture({ id: 1, gameweek: 4, kickoff: "2026-09-12T14:00:00Z" }),
    fixture({ id: 2, gameweek: 5, kickoff: "2026-09-19T14:00:00Z" }),
    fixture({ id: 3, gameweek: 5, kickoff: "2026-09-20T13:00:00Z" }),
    fixture({ id: 4, gameweek: 6, kickoff: "2026-10-10T14:00:00Z" }),
  ];

  it("names the round an instant falls in", () => {
    expect(roundAt(season, "2026-09-19T15:00:00Z")).toBe(5);
  });

  it("stays on a round through the gap between its matches", () => {
    expect(roundAt(season, "2026-09-20T09:00:00Z")).toBe(5);
  });

  it("does not run ahead to a round nobody has kicked off", () => {
    expect(roundAt(season, "2026-09-25T12:00:00Z")).toBe(5);
  });

  it("is null before the season starts", () => {
    expect(roundAt(season, "2026-08-01T12:00:00Z")).toBeNull();
  });

  it("ignores a fixture with no date", () => {
    expect(roundAt([fixture({ id: 9, gameweek: 7, kickoff: null })], at(0))).toBeNull();
  });
});

describe("before", () => {
  it("keeps what had happened and drops what had not", () => {
    const early = goal({ id: 1, absolute: KICKOFF + 10 * 60_000 });
    const late = goal({ id: 2, absolute: KICKOFF + 80 * 60_000 });
    expect(before([early, late], at(50)).map((g) => g.id)).toEqual([1]);
  });

  it("drops an event that cannot be placed in time", () => {
    expect(before([goal({ absolute: null })], at(50))).toEqual([]);
  });
});

describe("rewindRound", () => {
  it("has not kicked off a match whose time has not come", () => {
    const [rewound] = rewindRound(snap([fixture({ id: 1 })]), [], at(-30)).fixtures;
    expect(rewound.status).toBe("upcoming");
    expect(rewound.homeScore).toBeNull();
    expect(rewound.minutes).toBe(0);
    expect(rewound.settled).toBe(false);
  });

  it("puts a match in play with the score as it stood", () => {
    const goals = [
      goal({ id: 1, absolute: KICKOFF + 10 * 60_000, players: [10, null] }),
      goal({ id: 2, absolute: KICKOFF + 70 * 60_000, players: [20, null] }),
    ];
    const [rewound] = rewindRound(snap([fixture({ id: 1 })]), goals, at(30)).fixtures;
    expect(rewound.status).toBe("live");
    expect([rewound.homeScore, rewound.awayScore]).toEqual([1, 0]);
    expect(rewound.settled).toBe(false);
  });

  it("credits an own goal to the other side", () => {
    const goals = [goal({ kind: "own-goal", players: [10, null] })];
    const [rewound] = rewindRound(snap([fixture({ id: 1 })]), goals, at(30)).fixtures;
    expect([rewound.homeScore, rewound.awayScore]).toEqual([0, 1]);
  });

  it("gives no score at all when a goal names a man it cannot place", () => {
    const goals = [goal({ players: [null, null] })];
    const [rewound] = rewindRound(snap([fixture({ id: 1 })]), goals, at(30)).fixtures;
    expect(rewound.status).toBe("live");
    expect([rewound.homeScore, rewound.awayScore]).toEqual([null, null]);
  });

  it("does not count a goal from another match", () => {
    const goals = [goal({ fixtureCode: 999, players: [10, null] })];
    const [rewound] = rewindRound(snap([fixture({ id: 1 })]), goals, at(30)).fixtures;
    expect([rewound.homeScore, rewound.awayScore]).toEqual([0, 0]);
  });

  it("stops the clock for the interval and again at ninety", () => {
    const clock = (minutesIn: number) =>
      rewindRound(snap([fixture({ id: 1 })]), [], at(minutesIn)).fixtures[0].minutes;
    expect(clock(30)).toBe(30);
    expect(clock(50)).toBe(45);
    expect(clock(75)).toBe(60);
    expect(clock(110)).toBe(90);
  });

  it("leaves a match that was already over alone", () => {
    const [rewound] = rewindRound(snap([fixture({ id: 1 })]), [], at(200)).fixtures;
    expect(rewound.status).toBe("finished");
    expect([rewound.homeScore, rewound.awayScore]).toEqual([2, 1]);
    expect(rewound.settled).toBe(true);
  });

  it("leaves an undated fixture alone", () => {
    const [rewound] = rewindRound(snap([fixture({ id: 1, kickoff: null })]), [], at(30)).fixtures;
    expect(rewound.status).toBe("finished");
  });

  it("dates the snapshot to the instant it describes", () => {
    expect(rewindRound(snap([]), [], at(30)).fetchedAt).toBe(at(30));
  });

  it("throws on an instant it cannot read", () => {
    expect(() => rewindRound(snap([]), [], "not a time")).toThrow(/unreadable/i);
  });
});
