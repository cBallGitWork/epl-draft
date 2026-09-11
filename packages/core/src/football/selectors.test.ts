import { describe, expect, it } from "vitest";
import { NO_SEASON } from "./noSeason";
import { NOTABLE_SAVES } from "../config";
import type { FootballSnapshot, PlayerMatchStats } from "./types";
import {
  adjacentGameweeks,
  contributions,
  datedKickoffs,
  fixturesInOrder,
  hasGameweek,
  playerByCode,
  squadOf,
} from "./selectors";

const player = (id: number, name: string, clubId = 1) => ({
  id, code: 1000 + id, name, fullName: name, clubId,
  status: "a", news: "", chanceOfPlaying: null, optaCode: null, birthDate: null, newsAdded: null, season: NO_SEASON,
});

const stat = (over: Partial<PlayerMatchStats> & { playerId: number }): PlayerMatchStats => ({
  fixtureId: 1, minutes: 90, goals: 0, assists: 0, cleanSheet: false, goalsConceded: 0,
  ownGoals: 0, penaltiesSaved: 0, penaltiesMissed: 0, yellowCards: 0, redCards: 0,
  saves: 0, bonus: 0, bps: 0, defensiveContribution: 0, expectedGoals: 0,
  expectedAssists: 0, fplPoints: 0, starts: 1, ...over,
});

const snap = (over: Partial<FootballSnapshot> = {}): FootballSnapshot => ({
  clubs: [{ id: 1, code: 3, name: "Arsenal", shortName: "ARS" }],
  players: [player(1, "Saka"), player(2, "Ødegaard"), player(3, "Rice")],
  fixtures: [],
  stats: [],
  gameweek: 1,
  deadline: null,
  gameweeks: [1, 2, 3],
  fetchedAt: "2026-08-21T18:00:00Z",
  dataChecked: false,
  statsUnavailable: false,
  ...over,
});

describe("playerByCode", () => {
  it("keys on the season-stable code, not the per-season id", () => {
    // The ids and codes here overlap on purpose: a mapping persisted last season
    // holds codes, and looking one up by id would hand back a different player.
    const s = snap({ players: [player(1, "Saka"), player(2, "Ødegaard")] });
    expect(playerByCode(s).get(1001)?.name).toBe("Saka");
    expect(playerByCode(s).get(1)).toBeUndefined();
  });
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

  it("draws the line at the shared threshold rather than one of its own", () => {
    // Four views judge "worth mentioning" and the player sticker used to say 3
    // while the other three said 4, so the same keeper was notable on one screen
    // and not on the next. The constant is the fix; this pins it.
    const at = snap({ stats: [stat({ playerId: 1, saves: NOTABLE_SAVES })] });
    const under = snap({ stats: [stat({ playerId: 1, saves: NOTABLE_SAVES - 1 })] });
    expect(contributions(at, 1)).toHaveLength(1);
    expect(contributions(under, 1)).toEqual([]);
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
        { id: 1, code: 1, gameweek: 1, homeClubId: 1, awayClubId: 2, kickoff: null, homeScore: null, awayScore: null, status: "upcoming", settled: false, minutes: 0, homeDifficulty: null, awayDifficulty: null },
        { id: 2, code: 2, gameweek: 1, homeClubId: 3, awayClubId: 4, kickoff: "2026-08-21T19:00:00Z", homeScore: null, awayScore: null, status: "upcoming", settled: false, minutes: 0, homeDifficulty: null, awayDifficulty: null },
        { id: 3, code: 3, gameweek: 1, homeClubId: 5, awayClubId: 6, kickoff: "2026-08-21T14:00:00Z", homeScore: null, awayScore: null, status: "upcoming", settled: false, minutes: 0, homeDifficulty: null, awayDifficulty: null },
      ],
    });
    expect(fixturesInOrder(s).map((f) => f.id)).toEqual([3, 2, 1]);
  });
});

describe("datedKickoffs", () => {
  it("drops the undated and keeps the rest in the order they arrived", () => {
    expect(
      datedKickoffs([
        { id: 1, code: 1, gameweek: 1, homeClubId: 1, awayClubId: 2, kickoff: "2026-08-21T19:00:00Z", homeScore: null, awayScore: null, status: "upcoming", settled: false, minutes: 0, homeDifficulty: null, awayDifficulty: null },
        { id: 2, code: 2, gameweek: 1, homeClubId: 1, awayClubId: 2, kickoff: null, homeScore: null, awayScore: null, status: "upcoming", settled: false, minutes: 0, homeDifficulty: null, awayDifficulty: null },
        { id: 3, code: 3, gameweek: 2, homeClubId: 1, awayClubId: 2, kickoff: "2026-08-28T19:00:00Z", homeScore: null, awayScore: null, status: "upcoming", settled: false, minutes: 0, homeDifficulty: null, awayDifficulty: null },
      ]),
    ).toEqual([
      { gameweek: 1, kickoff: "2026-08-21T19:00:00Z" },
      { gameweek: 2, kickoff: "2026-08-28T19:00:00Z" },
    ]);
  });

  // A fixture FPL has not assigned to a round is as unusable as an undated one:
  // the league layer asks this for a gameweek's kickoff, and there is no
  // gameweek to answer for.
  it("drops a fixture with no gameweek, dated or not", () => {
    expect(datedKickoffs([{ id: 4, code: 4, gameweek: null, homeClubId: 1, awayClubId: 2, kickoff: "2026-08-21T19:00:00Z", homeScore: null, awayScore: null, status: "upcoming", settled: false, minutes: 0, homeDifficulty: null, awayDifficulty: null }])).toEqual([]);
  });
});

describe("adjacentGameweeks", () => {
  it("offers both neighbours mid-season", () => {
    expect(adjacentGameweeks(snap({ gameweek: 2 }))).toEqual({ previous: 1, next: 3 });
  });

  it("has no previous at the start and no next at the end", () => {
    expect(adjacentGameweeks(snap({ gameweek: 1 })).previous).toBeNull();
    expect(adjacentGameweeks(snap({ gameweek: 3 })).next).toBeNull();
  });

  it("offers neither for a round outside the season", () => {
    expect(adjacentGameweeks(snap({ gameweek: 99 }))).toEqual({ previous: null, next: null });
  });

  it("reads the bounds from the data, not a constant 38", () => {
    // A season that gains or loses a round to postponements should not need a
    // code change.
    const short = snap({ gameweek: 5, gameweeks: [4, 5, 6, 7] });
    expect(adjacentGameweeks(short)).toEqual({ previous: 4, next: 6 });
  });
});

describe("hasGameweek", () => {
  it("accepts a round the season has and rejects one it does not", () => {
    expect(hasGameweek(snap(), 2)).toBe(true);
    expect(hasGameweek(snap(), 38)).toBe(false);
  });
});


describe("squadOf", () => {
  const departed = { ...player(4, "Woltemade", 1), status: "u", news: "Has joined Juventus on loan" };

  it("is the club's own, with the departed dropped", () => {
    const snapshot = snap({ players: [player(1, "Saka"), departed, player(5, "Palmer", 2)] });
    expect(squadOf(snapshot, 1).map((p) => p.name)).toEqual(["Saka"]);
  });

  it("keeps the injured, who are still at the club", () => {
    const hurt = { ...player(6, "Rice"), status: "i", news: "Hamstring", chanceOfPlaying: 0 };
    expect(squadOf(snap({ players: [hurt, departed] }), 1).map((p) => p.name)).toEqual(["Rice"]);
  });
});
