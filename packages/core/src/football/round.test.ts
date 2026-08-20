import { describe, expect, it } from "vitest";
import type { Fixture, FootballSnapshot } from "./types";
import {
  duringGameweek,
  gameweekStarted,
  gameweekStatus,
  isMatchdayLive,
  roundFinished,
  roundState,
} from "./round";

const snap = (over: Partial<FootballSnapshot> = {}): FootballSnapshot => ({
  clubs: [],
  players: [],
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

describe("roundState", () => {
  const at = (over: Partial<Fixture> & { id: number }): Fixture => ({
    gameweek: 1, homeClubId: 1, awayClubId: 2, kickoff: "2026-08-22T14:00:00Z",
    homeScore: null, awayScore: null, status: "finished", settled: true, minutes: 90,
    homeDifficulty: null, awayDifficulty: null, ...over,
  });

  it("answers live while a match is in play, whatever the rest of the round has done", () => {
    // The order matters and this is why: nine results in and one match still on
    // is a round that is both mostly finished and live, and live is what a
    // screen has to say about it.
    const s = snap({ fixtures: [at({ id: 1 }), at({ id: 2, status: "live", settled: false })] });
    expect(roundState(s)).toBe("live");
  });

  it("falls through to the finished ladder once nothing is in play", () => {
    expect(roundState(snap({ fixtures: [at({ id: 1 })] }))).toBe("provisional");
    expect(roundState(snap({ fixtures: [at({ id: 1 })], dataChecked: true }))).toBe("final");
    expect(roundState(snap({ fixtures: [at({ id: 1 }), at({ id: 2, settled: false })] }))).toBe(
      "bonus-settling",
    );
  });

  it("says nothing about a round nobody has kicked off", () => {
    expect(roundState(snap({ fixtures: [at({ id: 1, status: "upcoming", settled: false })] }))).toBeNull();
  });
});
