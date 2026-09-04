import { describe, expect, it } from "vitest";
import { clubStats } from "./clubStats";
import { NO_SEASON } from "./noSeason";
import type { Club, Fixture, FootballPlayer } from "./types";

const CLUBS: Club[] = [
  { id: 1, code: 3, name: "Arsenal", shortName: "ARS" },
  { id: 2, code: 8, name: "Chelsea", shortName: "CHE" },
];

const match = (over: Partial<Fixture>): Fixture => ({
  id: 1, gameweek: 1, homeClubId: 1, awayClubId: 2, kickoff: "2026-08-15T14:00:00Z",
  homeScore: 0, awayScore: 0, status: "finished", settled: true, minutes: 90,
  homeDifficulty: null, awayDifficulty: null, ...over,
});

const man = (over: Partial<FootballPlayer>): FootballPlayer => ({
  id: 1, code: 1, name: "Player", fullName: "Player", clubId: 1, status: "a",
  news: "", chanceOfPlaying: null, optaCode: null, birthDate: null, newsAdded: null, season: NO_SEASON, ...over,
});

const of = (rows: ReturnType<typeof clubStats>, clubId: number) =>
  rows.find((row) => row.clubId === clubId)!;

describe("clubStats", () => {
  it("splits a record into its home and away halves", () => {
    const rows = clubStats(
      [
        match({ id: 1, homeClubId: 1, awayClubId: 2, homeScore: 3, awayScore: 0 }),
        match({ id: 2, homeClubId: 2, awayClubId: 1, homeScore: 2, awayScore: 1 }),
      ],
      CLUBS,
      [],
    );

    expect(of(rows, 1).home).toEqual({
      played: 1, won: 1, drawn: 0, lost: 0, goalsFor: 3, goalsAgainst: 0,
    });
    expect(of(rows, 1).away).toEqual({
      played: 1, won: 0, drawn: 0, lost: 1, goalsFor: 1, goalsAgainst: 2,
    });
  });

  it("runs the form guide oldest first, in kickoff order", () => {
    // Deliberately handed to the function newest first: the run must come back
    // in the order the season was played, not the order the array arrived.
    const rows = clubStats(
      [
        match({ id: 2, kickoff: "2026-08-22T14:00:00Z", homeScore: 0, awayScore: 0 }),
        match({ id: 1, kickoff: "2026-08-15T14:00:00Z", homeScore: 2, awayScore: 0 }),
      ],
      CLUBS,
      [],
    );

    expect(of(rows, 1).form).toEqual(["W", "D"]);
    expect(of(rows, 2).form).toEqual(["L", "D"]);
  });

  it("counts a clean sheet and a blank off the same match", () => {
    const rows = clubStats([match({ homeScore: 1, awayScore: 0 })], CLUBS, []);
    expect(of(rows, 1).cleanSheets).toBe(1);
    expect(of(rows, 1).failedToScore).toBe(0);
    expect(of(rows, 2).cleanSheets).toBe(0);
    expect(of(rows, 2).failedToScore).toBe(1);
  });

  it("ignores a match still being played", () => {
    // FPL writes a running score onto a fixture in play, and a side leading at
    // half time has kept no clean sheet.
    const rows = clubStats(
      [match({ status: "live", homeScore: 2, awayScore: 0 })],
      CLUBS,
      [],
    );
    expect(of(rows, 1).home.played).toBe(0);
    expect(of(rows, 1).cleanSheets).toBe(0);
    expect(of(rows, 1).form).toEqual([]);
  });

  it("counts for neither side when a fixture names a club we do not carry", () => {
    const rows = clubStats([match({ awayClubId: 99, homeScore: 4, awayScore: 0 })], CLUBS, []);
    expect(of(rows, 1).home.played).toBe(0);
  });

  it("adds up the squad's season, every man on the books", () => {
    const rows = clubStats([], CLUBS, [
      man({ id: 1, clubId: 1, season: { ...NO_SEASON, goals: 3, assists: 1, minutes: 180 } }),
      man({ id: 2, clubId: 1, season: { ...NO_SEASON, goals: 2, minutes: 90 } }),
      // On the books and never played. He is part of the denominator.
      man({ id: 3, clubId: 1, season: NO_SEASON }),
      man({ id: 4, clubId: 2, season: { ...NO_SEASON, goals: 9 } }),
    ]);

    expect(of(rows, 1).squad.goals).toBe(5);
    expect(of(rows, 1).squad.assists).toBe(1);
    expect(of(rows, 1).squad.minutes).toBe(270);
    expect(of(rows, 2).squad.goals).toBe(9);
  });

  it("gives every club a row, including one that has not played", () => {
    const rows = clubStats([], CLUBS, []);
    expect(rows).toHaveLength(2);
    expect(of(rows, 2).form).toEqual([]);
  });

  it("does not let one club's squad total leak into another's", () => {
    // `NO_SEASON` is frozen and shared; a row that used it directly rather than
    // copying it would throw here, or worse, would not.
    const rows = clubStats([], CLUBS, [man({ clubId: 1, season: { ...NO_SEASON, goals: 4 } })]);
    expect(of(rows, 2).squad.goals).toBe(0);
    expect(NO_SEASON.goals).toBe(0);
  });
});
