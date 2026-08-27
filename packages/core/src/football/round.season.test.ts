import { describe, expect, it } from "vitest";
import type { Fixture } from "./types";
import { gameweekStarted, gameweekStatus, nextRound } from "./round";

// The half of `round.ts` that is asked of the SEASON rather than of a snapshot.
//
// `round.ts` draws this line itself, in its signatures: `gameweekStatus`,
// `gameweekStarted` and `nextRound` take `readonly Fixture[]` because the caller
// labelling thirty-eight rounds at once holds the season and not one round of it.
// The other four take a `FootballSnapshot` and live in `round.test.ts`. Splitting
// on the seam the source already has beats splitting on line count.

/** One fixture, with the eleven fields written once. An upcoming, unsettled match
 *  at gameweek 1's first kickoff; what a test is about is the override beside it. */
const fixture = (over: Partial<Fixture> & { id: number }): Fixture => ({
  gameweek: 1, homeClubId: 1, awayClubId: 2, kickoff: "2026-08-21T19:00:00Z",
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

describe("nextRound", () => {
  // GW1 ran 21-24 Aug 2026; GW2's deadline was 28 Aug 17:30Z and its first
  // kickoff 28 Aug 19:00Z. Real instants, because the bug this function fixes
  // was only ever visible at particular ones.
  const season = [
    fixture({ id: 1, gameweek: 1, kickoff: "2026-08-21T19:00:00Z", status: "finished" }),
    fixture({ id: 2, gameweek: 1, kickoff: "2026-08-24T19:00:00Z", status: "finished" }),
    fixture({ id: 3, gameweek: 2, kickoff: "2026-08-28T19:00:00Z" }),
    fixture({ id: 4, gameweek: 2, kickoff: "2026-08-31T19:00:00Z" }),
    fixture({ id: 5, gameweek: 3, kickoff: "2026-09-05T14:00:00Z" }),
  ];

  it("names the round coming up once every match in the current one is over", () => {
    // The state the app sat in for four days after GW1 and could not describe:
    // it held only the focused round's fixtures, so it said the next one would
    // appear "once FPL names its fixtures" — which FPL had done weeks earlier.
    expect(nextRound(season, "2026-08-24T21:00:00Z")).toEqual({
      gameweek: 2,
      kickoff: "2026-08-28T19:00:00Z",
    });
  });

  it("gives the same answer either side of FPL's deadline", () => {
    // `focusGameweek` flips here and this must not: the round coming up is the
    // same round ninety minutes before its first kickoff as it was a minute ago.
    const before = nextRound(season, "2026-08-28T17:29:59Z");
    const after = nextRound(season, "2026-08-28T17:30:00Z");
    expect(before).toEqual(after);
    expect(after?.gameweek).toBe(2);
  });

  it("counts the ball being kicked right now as the next one", () => {
    expect(nextRound(season, "2026-08-28T19:00:00Z")?.gameweek).toBe(2);
  });

  it("names the round after the one in play, and is not asked while it is", () => {
    // Monday 20:45, GW2's last match running. This says 3 — correctly, because
    // GW3 is the next round to start — which is why `/matchday` only asks it
    // once `duringGameweek` is already false.
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
    // FPL leaves a rearranged match in its original event. Reading "the lowest
    // gameweek with an unfinished fixture" would answer 20 from December until
    // February; the next ball to be kicked is 21.
    const postponed = [
      fixture({ id: 1, gameweek: 20, kickoff: "2027-02-10T19:45:00Z" }),
      fixture({ id: 2, gameweek: 21, kickoff: "2026-12-26T15:00:00Z" }),
    ];
    expect(nextRound(postponed, "2026-12-20T12:00:00Z")?.gameweek).toBe(21);
  });
});
