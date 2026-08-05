import { describe, expect, it } from "vitest";
import type { FootballSnapshot, PlayerMatchStats } from "./types";
import { contributions, fixturesInOrder, isMatchdayLive } from "./selectors";

const player = (id: number, name: string, clubId = 1) => ({
  id, code: 1000 + id, name, fullName: name, clubId, position: "MID" as const,
  squadNumber: null, status: "a", news: "", chanceOfPlaying: null, optaCode: null,
});

const stat = (over: Partial<PlayerMatchStats> & { playerId: number }): PlayerMatchStats => ({
  fixtureId: 1, minutes: 90, goals: 0, assists: 0, cleanSheet: false, goalsConceded: 0,
  ownGoals: 0, penaltiesSaved: 0, penaltiesMissed: 0, yellowCards: 0, redCards: 0,
  saves: 0, bonus: 0, bps: 0, defensiveContribution: 0, expectedGoals: 0,
  expectedAssists: 0, ...over,
});

const snap = (over: Partial<FootballSnapshot> = {}): FootballSnapshot => ({
  clubs: [{ id: 1, code: 3, name: "Arsenal", shortName: "ARS" }],
  players: [player(1, "Saka"), player(2, "Ødegaard"), player(3, "Rice")],
  fixtures: [],
  stats: [],
  gameweek: 1,
  deadline: null,
  fetchedAt: "2026-08-21T18:00:00Z",
  ...over,
});

describe("contributions", () => {
  it("omits players who merely turned out", () => {
    // A drop-down answering "what happened" must not list 22 anonymous names.
    const s = snap({ stats: [stat({ playerId: 1 }), stat({ playerId: 2, goals: 1 })] });
    expect(contributions(s, 1).map((c) => c.player.name)).toEqual(["Ødegaard"]);
  });

  it("ranks goals above assists above cards", () => {
    const s = snap({
      stats: [
        stat({ playerId: 1, yellowCards: 1 }),
        stat({ playerId: 2, assists: 1 }),
        stat({ playerId: 3, goals: 1 }),
      ],
    });
    expect(contributions(s, 1).map((c) => c.player.name)).toEqual(["Rice", "Ødegaard", "Saka"]);
  });

  it("counts a busy keeper as notable but a quiet one as not", () => {
    const s = snap({ stats: [stat({ playerId: 1, saves: 4 }), stat({ playerId: 2, saves: 2 })] });
    expect(contributions(s, 1)).toHaveLength(1);
  });

  it("ignores other fixtures and unknown players", () => {
    const s = snap({
      stats: [stat({ playerId: 2, goals: 1, fixtureId: 99 }), stat({ playerId: 404, goals: 5 })],
    });
    expect(contributions(s, 1)).toEqual([]);
  });
});

describe("fixturesInOrder", () => {
  it("sorts by kickoff and pushes undated TV picks to the end", () => {
    const s = snap({
      fixtures: [
        { id: 1, gameweek: 1, homeClubId: 1, awayClubId: 2, kickoff: null, homeScore: null, awayScore: null, status: "upcoming", minutes: 0 },
        { id: 2, gameweek: 1, homeClubId: 3, awayClubId: 4, kickoff: "2026-08-21T19:00:00Z", homeScore: null, awayScore: null, status: "upcoming", minutes: 0 },
        { id: 3, gameweek: 1, homeClubId: 5, awayClubId: 6, kickoff: "2026-08-21T14:00:00Z", homeScore: null, awayScore: null, status: "upcoming", minutes: 0 },
      ],
    });
    expect(fixturesInOrder(s).map((f) => f.id)).toEqual([3, 2, 1]);
  });
});

describe("isMatchdayLive", () => {
  it("is true only while a match is actually in play", () => {
    const base = { gameweek: 1, homeClubId: 1, awayClubId: 2, kickoff: null, homeScore: null, awayScore: null, minutes: 0 };
    expect(isMatchdayLive(snap({ fixtures: [{ ...base, id: 1, status: "finished" }] }))).toBe(false);
    expect(isMatchdayLive(snap({ fixtures: [{ ...base, id: 1, status: "live" }] }))).toBe(true);
  });
});
