import { describe, expect, it } from "vitest";
import { POSTPONED_AFTER_MINUTES } from "../config";
import type { Fixture, FootballSnapshot } from "./types";
import { duringGameweek, isMatchdayLive, roundFinished, roundStarted, roundState, secondsToLive } from "./round";

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

/** One fixture, with the eleven fields written once. The defaults are an
 *  upcoming, unsettled match at gameweek 1's first kickoff; what a test is about
 *  is the override beside it. */
const fixture = (over: Partial<Fixture> & { id: number }): Fixture => ({
  code: 1, gameweek: 1, homeClubId: 1, awayClubId: 2, kickoff: "2026-08-21T19:00:00Z",
  homeScore: null, awayScore: null, status: "upcoming", settled: false, minutes: 0,
  homeDifficulty: null, awayDifficulty: null, ...over,
});

/** A match played and signed off. Layered on `fixture`, because "a round of
 *  finished matches with one exception" is what most of the ladder's tests are
 *  and the exception is the assertion's subject. */
const played = (over: Partial<Fixture> & { id: number }): Fixture =>
  fixture({ status: "finished", settled: true, minutes: 90, kickoff: "2026-08-22T14:00:00Z", ...over });

describe("isMatchdayLive", () => {
  it("is true only while a match is actually in play", () => {
    const one = (status: Fixture["status"]) => snap({ fixtures: [fixture({ id: 1, status })] });
    expect(isMatchdayLive(one("finished"))).toBe(false);
    expect(isMatchdayLive(one("live"))).toBe(true);
  });
});

describe("duringGameweek", () => {
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

  it("lets go of a match still unstarted past the window after its kickoff: called off, whatever date FPL leaves", () => {
    // The rest played on the Saturday; one called off at 16:30 never starts, and FPL keeps its date.
    const calledOff = snap({ fixtures: [played({ id: 1 }), fixture({ id: 2, kickoff: "2026-08-22T16:30:00Z" })] });
    const after = (minutes: number) => new Date(Date.parse("2026-08-22T16:30:00Z") + minutes * 60_000).toISOString();
    expect(duringGameweek(calledOff, after(POSTPONED_AFTER_MINUTES))).toBe(true);
    expect(duringGameweek(calledOff, after(POSTPONED_AFTER_MINUTES + 1))).toBe(false);
    expect(duringGameweek(calledOff, "2026-08-25T12:00:00Z")).toBe(false);
  });

  it("does not open on an opener that was called off", () => {
    const s = snap({
      fixtures: [fixture({ id: 1, kickoff: "2026-08-21T19:00:00Z" }), fixture({ id: 2, kickoff: "2026-08-22T11:30:00Z" })],
    });
    expect(duringGameweek(s, "2026-08-22T09:00:00Z")).toBe(false);
    expect(duringGameweek(s, "2026-08-22T11:30:00Z")).toBe(true);
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

describe("roundFinished", () => {
  it("says nothing about a round still being played", () => {
    const s = snap({ fixtures: [played({ id: 1 }), played({ id: 2, status: "live", settled: false })] });
    expect(roundFinished(s)).toBeNull();
  });

  it("says nothing about a round nobody has kicked off", () => {
    // Same answer as a live round, and deliberately: the two are told apart by
    // `isMatchdayLive`, not by this growing a fourth state it would have to
    // invent from the same evidence.
    const s = snap({ fixtures: [played({ id: 1, status: "upcoming", settled: false })] });
    expect(roundFinished(s)).toBeNull();
  });

  it("holds at bonus-settling between the whistle and the bonus points", () => {
    // The provisional whistle: `status` reads finished, raw `finished` has not
    // flipped, and Fantrax's total is still going to move.
    const s = snap({ fixtures: [played({ id: 1 }), played({ id: 2, settled: false })] });
    expect(roundFinished(s)).toBe("bonus-settling");
  });

  it("is provisional once bonus has landed but FPL has not signed the round off", () => {
    expect(roundFinished(snap({ fixtures: [played({ id: 1 })] }))).toBe("provisional");
  });

  it("claims final only at data_checked", () => {
    const s = snap({ fixtures: [played({ id: 1 })], dataChecked: true });
    expect(roundFinished(s)).toBe("final");
  });

  it("will not call a round final on FPL's sign-off alone while a match is unplayed", () => {
    // `data_checked` belongs to the event and the fixtures belong to the round.
    // The fixtures win: a signed-off round with a match still to play is FPL
    // contradicting itself, and the safe reading of a contradiction is silence.
    const s = snap({
      fixtures: [played({ id: 1 }), played({ id: 2, status: "upcoming", settled: false })],
      dataChecked: true,
    });
    expect(roundFinished(s)).toBeNull();
  });

  it("ignores undated fixtures at both ends", () => {
    // A TV pick with no time cannot hold a finished round open — the same rule
    // `duringGameweek` applies, for the same reason.
    const s = snap({
      fixtures: [played({ id: 1 }), played({ id: 2, kickoff: null, status: "upcoming", settled: false })],
    });
    expect(roundFinished(s)).toBe("provisional");
  });

  it("says nothing about a round with no dated fixtures at all", () => {
    // Not finished — unscheduled. "Every match has ended" is vacuously true of
    // none, and a full-time label on a week nobody has arranged is a lie.
    expect(roundFinished(snap({ fixtures: [] }))).toBeNull();
    expect(roundFinished(snap({ fixtures: [played({ id: 1, kickoff: null })] }))).toBeNull();
  });
});

describe("roundState", () => {
  it("answers live while a match is in play, whatever the rest of the round has done", () => {
    // The order matters and this is why: nine results in and one match still on
    // is a round that is both mostly finished and live, and live is what a
    // screen has to say about it.
    const s = snap({ fixtures: [played({ id: 1 }), played({ id: 2, status: "live", settled: false })] });
    expect(roundState(s)).toBe("live");
  });

  it("falls through to the finished ladder once nothing is in play", () => {
    expect(roundState(snap({ fixtures: [played({ id: 1 })] }))).toBe("provisional");
    expect(roundState(snap({ fixtures: [played({ id: 1 })], dataChecked: true }))).toBe("final");
    expect(roundState(snap({ fixtures: [played({ id: 1 }), played({ id: 2, settled: false })] }))).toBe(
      "bonus-settling",
    );
  });

  it("says nothing about a round nobody has kicked off", () => {
    expect(roundState(snap({ fixtures: [played({ id: 1, status: "upcoming", settled: false })] }))).toBeNull();
  });
});

describe("roundStarted", () => {
  const round = (...over: Partial<Fixture>[]) =>
    snap({ fixtures: over.map((o, i) => fixture({ id: i + 1, ...o })) });

  it("is false while every fixture is still to come", () => {
    expect(roundStarted(round({ gameweek: 4 }, { gameweek: 4 }), 4)).toBe(false);
  });

  it("is true once one has kicked off, and stays true between kickoffs", () => {
    // The state `roundState` cannot report: Saturday tea-time, nothing in play,
    // and plenty already happened.
    const tea = round({ gameweek: 4, status: "finished" }, { gameweek: 4 });
    expect(roundState(tea)).toBeNull();
    expect(roundStarted(tea, 4)).toBe(true);
  });

  it("asks about the round named, not about the snapshot", () => {
    expect(roundStarted(round({ gameweek: 3, status: "finished" }, { gameweek: 4 }), 4)).toBe(false);
  });

  it("is false for a round the snapshot has no fixtures for", () => {
    expect(roundStarted(round({ gameweek: 3, status: "finished" }), 9)).toBe(false);
  });
});

describe("secondsToLive", () => {
  const nextWeek = [fixture({ id: 11, gameweek: 2, kickoff: "2026-08-28T19:00:00Z" })];

  it("is nought while the round is under way", () => {
    const s = snap({ fixtures: [fixture({ id: 1, status: "live" })] });
    expect(secondsToLive(s, nextWeek, "2026-08-21T19:30:00Z")).toBe(0);
  });

  it("counts to the next kickoff when the snapshot still holds the finished round", () => {
    const s = snap({ fixtures: [played({ id: 1 })] });
    expect(secondsToLive(s, nextWeek, "2026-08-28T18:59:15Z")).toBe(45);
  });

  it("is nought at the kickoff instant itself", () => {
    const s = snap({ fixtures: [played({ id: 1 })] });
    expect(secondsToLive(s, nextWeek, "2026-08-28T19:00:00Z")).toBe(0);
  });

  it("is null with no football ahead", () => {
    const s = snap({ fixtures: [played({ id: 1 })] });
    expect(secondsToLive(s, nextWeek, "2026-09-01T00:00:00Z")).toBeNull();
  });

  it("ignores undated fixtures", () => {
    const s = snap({ fixtures: [played({ id: 1 })] });
    const undated = [fixture({ id: 12, gameweek: 2, kickoff: null })];
    expect(secondsToLive(s, undated, "2026-08-28T18:00:00Z")).toBeNull();
  });

  it("counts to the next kickoff past a match called off, rather than polling at the live rate for days", () => {
    const s = snap({ fixtures: [played({ id: 1 }), fixture({ id: 2, kickoff: "2026-08-22T16:30:00Z" })] });
    expect(secondsToLive(s, nextWeek, "2026-08-28T18:59:15Z")).toBe(45);
  });
});
