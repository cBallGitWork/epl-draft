import { describe, expect, it } from "vitest";
import { NOTABLE_SAVES } from "../config";
import type { Fixture, FootballSnapshot, PlayerMatchStats } from "./types";
import {
  adjacentGameweeks,
  contributions,
  duringGameweek,
  fixturesInOrder,
  gameweekStatus,
  hasGameweek,
  gameweekStarted,
  isMatchdayLive,
  isDoubtful,
  playerByCode,
  roundFinished,
} from "./selectors";

const player = (id: number, name: string, clubId = 1) => ({
  id, code: 1000 + id, name, fullName: name, clubId,
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
        { id: 1, gameweek: 1, homeClubId: 1, awayClubId: 2, kickoff: null, homeScore: null, awayScore: null, status: "upcoming", settled: false, minutes: 0, homeDifficulty: null, awayDifficulty: null },
        { id: 2, gameweek: 1, homeClubId: 3, awayClubId: 4, kickoff: "2026-08-21T19:00:00Z", homeScore: null, awayScore: null, status: "upcoming", settled: false, minutes: 0, homeDifficulty: null, awayDifficulty: null },
        { id: 3, gameweek: 1, homeClubId: 5, awayClubId: 6, kickoff: "2026-08-21T14:00:00Z", homeScore: null, awayScore: null, status: "upcoming", settled: false, minutes: 0, homeDifficulty: null, awayDifficulty: null },
      ],
    });
    expect(fixturesInOrder(s).map((f) => f.id)).toEqual([3, 2, 1]);
  });
});

describe("isMatchdayLive", () => {
  it("is true only while a match is actually in play", () => {
    const base = {
      gameweek: 1, homeClubId: 1, awayClubId: 2, kickoff: null, homeScore: null,
      awayScore: null, settled: false, minutes: 0, homeDifficulty: null,
      awayDifficulty: null,
    };
    expect(isMatchdayLive(snap({ fixtures: [{ ...base, id: 1, status: "finished" }] }))).toBe(false);
    expect(isMatchdayLive(snap({ fixtures: [{ ...base, id: 1, status: "live" }] }))).toBe(true);
  });
});

describe("duringGameweek", () => {
  const fixture = (over: Partial<Fixture> & { id: number }): Fixture => ({
    gameweek: 1, homeClubId: 1, awayClubId: 2, kickoff: "2026-08-21T19:00:00Z",
    homeScore: null, awayScore: null, status: "upcoming", settled: false, minutes: 0,
    homeDifficulty: null, awayDifficulty: null, ...over,
  });

  it("opens at the first kickoff, not at the deadline before it", () => {
    const s = snap({ fixtures: [fixture({ id: 1 })] });
    expect(duringGameweek(s, "2026-08-21T18:00:00Z")).toBe(false);
    expect(duringGameweek(s, "2026-08-21T19:00:00Z")).toBe(true);
  });

  it("stays open between matches, when nothing is in play", () => {
    // The gap `isMatchdayLive` cannot see: Saturday teatime, one match done and
    // the next not started, which is still matchday to whoever is watching.
    const s = snap({
      fixtures: [
        fixture({ id: 1, kickoff: "2026-08-22T11:30:00Z", status: "finished" }),
        fixture({ id: 2, kickoff: "2026-08-22T16:30:00Z" }),
      ],
    });
    expect(duringGameweek(s, "2026-08-22T15:00:00Z")).toBe(true);
    expect(isMatchdayLive(s)).toBe(false);
  });

  it("closes once every dated match is over, without waiting for bonus", () => {
    const s = snap({ fixtures: [fixture({ id: 1, status: "finished" })] });
    expect(duringGameweek(s, "2026-08-21T21:00:00Z")).toBe(false);
  });

  it("is not opened or closed by an undated fixture", () => {
    // A TV pick with no time must not open the window early, and a match
    // postponed out of its slot must not hold it open for a month.
    const undatedOnly = snap({ fixtures: [fixture({ id: 1, kickoff: null })] });
    expect(duringGameweek(undatedOnly, "2026-08-22T15:00:00Z")).toBe(false);

    const restFinished = snap({
      fixtures: [fixture({ id: 1, status: "finished" }), fixture({ id: 2, kickoff: null })],
    });
    expect(duringGameweek(restFinished, "2026-08-21T21:00:00Z")).toBe(false);
  });

  it("compares instants, so an offset kickoff is not read as a later one", () => {
    // The trap `calendar.ts` documents: "2026-08-21T20:00:00+01:00" sorts after
    // "2026-08-21T19:30:00Z" as text while being the same moment as 19:00Z.
    const s = snap({ fixtures: [fixture({ id: 1, kickoff: "2026-08-21T20:00:00+01:00" })] });
    expect(duringGameweek(s, "2026-08-21T19:30:00Z")).toBe(true);
  });

  it("says no when it cannot tell", () => {
    // Fails toward the section not existing: a phantom tab during an outage is
    // worse than a missing one, and the page behind it would have nothing to say.
    expect(duringGameweek(snap({ fixtures: [] }), "2026-08-22T15:00:00Z")).toBe(false);
    expect(duringGameweek(snap({ fixtures: [fixture({ id: 1 })] }), "not a date")).toBe(false);
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

describe("isDoubtful", () => {
  const fit = player(1, "Fit");

  it("says nothing about a fit player", () => {
    expect(isDoubtful(fit)).toBe(false);
    // FPL states a hundred percent with no note for plenty of fit players, and
    // that combination is the one number that is not a doubt.
    expect(isDoubtful({ ...fit, chanceOfPlaying: 100 })).toBe(false);
  });

  it("catches every way FPL raises one", () => {
    expect(isDoubtful({ ...fit, status: "d" })).toBe(true);
    expect(isDoubtful({ ...fit, news: "Knock - 75% chance of playing" })).toBe(true);
    // The case the two readers used to disagree on: a stated chance, no words.
    expect(isDoubtful({ ...fit, chanceOfPlaying: 75 })).toBe(true);
    expect(isDoubtful({ ...fit, chanceOfPlaying: 0 })).toBe(true);
  });

  it("still counts a hundred percent when there is news with it", () => {
    // "Returned to training, expected to start" is news worth reading even at
    // full confidence.
    expect(isDoubtful({ ...fit, news: "Back in training", chanceOfPlaying: 100 })).toBe(true);
  });
});

describe("gameweekStatus", () => {
  const at = (id: number, gameweek: number, status: Fixture["status"]): Fixture => ({
    id,
    gameweek,
    settled: false,
    homeClubId: 1,
    awayClubId: 2,
    kickoff: "2026-08-21T19:00:00Z",
    homeScore: null,
    awayScore: null,
    status,
    minutes: 0,
    homeDifficulty: null,
    awayDifficulty: null,
  });

  const season = [
    at(1, 1, "finished"),
    at(2, 1, "finished"),
    at(3, 2, "finished"),
    at(4, 2, "live"),
    at(5, 3, "finished"),
    at(6, 3, "upcoming"),
    at(7, 4, "upcoming"),
  ];

  it("is finished only when every match in the round has ended", () => {
    expect(gameweekStatus(season, 1)).toBe("finished");
  });

  it("is live while any match in the round is in play", () => {
    expect(gameweekStatus(season, 2)).toBe("live");
  });

  it("is upcoming for a round part-played with nothing on", () => {
    // Sunday morning after Saturday's results. Nothing is live and the round is
    // not over, and calling it finished would put a full-time label on it.
    expect(gameweekStatus(season, 3)).toBe("upcoming");
    expect(gameweekStatus(season, 4)).toBe("upcoming");
  });

  it("is upcoming for a round with no fixtures at all", () => {
    expect(gameweekStatus(season, 38)).toBe("upcoming");
  });
});

describe("gameweekStarted", () => {
  const at = (id: number, gameweek: number, status: Fixture["status"]): Fixture => ({
    id,
    gameweek,
    settled: false,
    homeClubId: 1,
    awayClubId: 2,
    kickoff: "2026-08-21T19:00:00Z",
    homeScore: null,
    awayScore: null,
    status,
    minutes: 0,
    homeDifficulty: null,
    awayDifficulty: null,
  });

  it("is true for a round part-played with nothing on", () => {
    // Six o'clock on a Saturday, nine results in and a Monday night match to
    // come. `gameweekStatus` calls this "upcoming" — correctly, because it is
    // not full time — and reading that as "no football has happened" hid every
    // one of the nine until Monday.
    const season = [at(1, 7, "finished"), at(2, 7, "finished"), at(3, 7, "upcoming")];
    expect(gameweekStatus(season, 7)).toBe("upcoming");
    expect(gameweekStarted(season, 7)).toBe(true);
  });

  it("is false before the first ball of the round", () => {
    expect(gameweekStarted([at(1, 7, "upcoming"), at(2, 7, "upcoming")], 7)).toBe(false);
  });

  it("is true while a match is in play, and after the last one", () => {
    expect(gameweekStarted([at(1, 7, "live")], 7)).toBe(true);
    expect(gameweekStarted([at(1, 7, "finished")], 7)).toBe(true);
  });

  it("ignores other rounds, and a round with no fixtures has not started", () => {
    expect(gameweekStarted([at(1, 6, "finished")], 7)).toBe(false);
    expect(gameweekStarted([], 7)).toBe(false);
  });
});

describe("roundFinished", () => {
  const at = (over: Partial<Fixture> & { id: number }): Fixture => ({
    gameweek: 1, homeClubId: 1, awayClubId: 2, kickoff: "2026-08-22T14:00:00Z",
    homeScore: null, awayScore: null, status: "finished", settled: true, minutes: 90,
    homeDifficulty: null, awayDifficulty: null, ...over,
  });

  it("says nothing about a round still being played", () => {
    const s = snap({ fixtures: [at({ id: 1 }), at({ id: 2, status: "live", settled: false })] });
    expect(roundFinished(s)).toBeNull();
  });

  it("says nothing about a round nobody has kicked off", () => {
    // Same answer as a live round, and deliberately: the two are told apart by
    // `isMatchdayLive`, not by this growing a fourth state it would have to
    // invent from the same evidence.
    const s = snap({ fixtures: [at({ id: 1, status: "upcoming", settled: false })] });
    expect(roundFinished(s)).toBeNull();
  });

  it("holds at bonus-settling between the whistle and the bonus points", () => {
    // The provisional whistle: `status` reads finished, raw `finished` has not
    // flipped, and Fantrax's total is still going to move.
    const s = snap({ fixtures: [at({ id: 1 }), at({ id: 2, settled: false })] });
    expect(roundFinished(s)).toBe("bonus-settling");
  });

  it("is provisional once bonus has landed but FPL has not signed the round off", () => {
    expect(roundFinished(snap({ fixtures: [at({ id: 1 })] }))).toBe("provisional");
  });

  it("claims final only at data_checked", () => {
    const s = snap({ fixtures: [at({ id: 1 })], dataChecked: true });
    expect(roundFinished(s)).toBe("final");
  });

  it("will not call a round final on FPL's sign-off alone while a match is unplayed", () => {
    // `data_checked` belongs to the event and the fixtures belong to the round.
    // The fixtures win: a signed-off round with a match still to play is FPL
    // contradicting itself, and the safe reading of a contradiction is silence.
    const s = snap({
      fixtures: [at({ id: 1 }), at({ id: 2, status: "upcoming", settled: false })],
      dataChecked: true,
    });
    expect(roundFinished(s)).toBeNull();
  });

  it("ignores undated fixtures at both ends", () => {
    // A TV pick with no time cannot hold a finished round open — the same rule
    // `duringGameweek` applies, for the same reason.
    const s = snap({
      fixtures: [at({ id: 1 }), at({ id: 2, kickoff: null, status: "upcoming", settled: false })],
    });
    expect(roundFinished(s)).toBe("provisional");
  });

  it("says nothing about a round with no dated fixtures at all", () => {
    // Not finished — unscheduled. "Every match has ended" is vacuously true of
    // none, and a full-time label on a week nobody has arranged is a lie.
    expect(roundFinished(snap({ fixtures: [] }))).toBeNull();
    expect(roundFinished(snap({ fixtures: [at({ id: 1, kickoff: null })] }))).toBeNull();
  });
});
