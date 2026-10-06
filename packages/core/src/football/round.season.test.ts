import { describe, expect, it } from "vitest";
import type { Fixture } from "./types";
import { gameweekStarted, gameweekStatus, nextRound } from "./round";

// The `round.ts` functions asked of the season's fixtures; those asked of a snapshot are in `round.test.ts`.

/** An upcoming, unsettled gameweek 1 fixture; what a test is about is the override beside it. */
const fixture = (over: Partial<Fixture> & { id: number }): Fixture => ({
  code: 1, gameweek: 1, homeClubId: 1, awayClubId: 2, kickoff: "2026-08-21T19:00:00Z",
  homeScore: null, awayScore: null, status: "upcoming", settled: false, minutes: 0,
  homeDifficulty: null, awayDifficulty: null, ...over,
});

describe("gameweekStatus", () => {
  // Positional, because these two describes build whole seasons and read as
  // tables of (id, gameweek, status). Two occurrences stay duplicated.
  const at = (id: number, gameweek: number, status: Fixture["status"]): Fixture =>
    fixture({ id, gameweek, status });

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
  // Positional, because these two describes build whole seasons and read as
  // tables of (id, gameweek, status). Two occurrences stay duplicated.
  const at = (id: number, gameweek: number, status: Fixture["status"]): Fixture =>
    fixture({ id, gameweek, status });

  it("is true for a round part-played with nothing on", () => {
    // Saturday evening with a Monday match to come: "upcoming" by status, yet started.
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

describe("nextRound", () => {
  // Real instants: GW1 ran 21-24 Aug 2026; GW2's deadline was 28 Aug 17:30Z, its first kickoff 19:00Z.
  const season = [
    fixture({ id: 1, gameweek: 1, kickoff: "2026-08-21T19:00:00Z", status: "finished" }),
    fixture({ id: 2, gameweek: 1, kickoff: "2026-08-24T19:00:00Z", status: "finished" }),
    fixture({ id: 3, gameweek: 2, kickoff: "2026-08-28T19:00:00Z" }),
    fixture({ id: 4, gameweek: 2, kickoff: "2026-08-31T19:00:00Z" }),
    fixture({ id: 5, gameweek: 3, kickoff: "2026-09-05T14:00:00Z" }),
  ];

  it("names the round coming up once every match in the current one is over", () => {
    expect(nextRound(season, "2026-08-24T21:00:00Z")).toEqual({
      gameweek: 2,
      kickoff: "2026-08-28T19:00:00Z",
    });
  });

  it("gives the same answer either side of FPL's deadline", () => {
    // `focusGameweek` flips at the deadline; this must not.
    const before = nextRound(season, "2026-08-28T17:29:59Z");
    const after = nextRound(season, "2026-08-28T17:30:00Z");
    expect(before).toEqual(after);
    expect(after?.gameweek).toBe(2);
  });

  it("counts the ball being kicked right now as the next one", () => {
    expect(nextRound(season, "2026-08-28T19:00:00Z")?.gameweek).toBe(2);
  });

  it("names the round after the one in play, and is not asked while it is", () => {
    // GW2's last match is running, so this says 3; callers ask only once `duringGameweek` is false.
    expect(nextRound(season, "2026-08-31T20:45:00Z")?.gameweek).toBe(3);
  });

  it("says nothing once the season's football is all in the past", () => {
    expect(nextRound(season, "2027-05-24T00:00:00Z")).toBeNull();
  });

  it("cannot be named by a fixture with no date or no round", () => {
    expect(nextRound([fixture({ id: 9, kickoff: null })], "2026-08-24T21:00:00Z")).toBeNull();
    expect(
      nextRound([fixture({ id: 9, gameweek: null, kickoff: "2026-09-01T19:00:00Z" })],
        "2026-08-24T21:00:00Z"),
    ).toBeNull();
  });

  it("follows the kickoff and not the gameweek number, so a postponement cannot hold it", () => {
    // FPL leaves a rearranged match in its original event; the next ball to be kicked is in 21.
    const postponed = [
      fixture({ id: 1, gameweek: 20, kickoff: "2027-02-10T19:45:00Z" }),
      fixture({ id: 2, gameweek: 21, kickoff: "2026-12-26T15:00:00Z" }),
    ];
    expect(nextRound(postponed, "2026-12-20T12:00:00Z")?.gameweek).toBe(21);
  });
});
