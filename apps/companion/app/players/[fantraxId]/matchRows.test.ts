import { describe, expect, it } from "vitest";
import type { Club, GameLogEntry, PlayerMatch } from "@epl/core";
import { joinMatches, totalsOf } from "./matchRows";
import type { MatchRow } from "./matchRows";

const club = (id: number, shortName: string): Club => ({ id, code: id, name: shortName, shortName });
const CLUBS = new Map<number, Club>([
  [1, club(1, "IPS")],
  [2, club(2, "HUL")],
  [3, club(3, "NFO")],
]);

const match = (over: Partial<GameLogEntry> = {}): GameLogEntry => ({
  gameweek: 1, fixtureId: 1, opponentClubId: 1, home: true, scored: 1, conceded: 0,
  minutes: 90, goals: 0, assists: 0, cleanSheet: true, yellowCards: 0, redCards: 0,
  saves: 0, fplPoints: 6, defensiveContribution: null,
  expectedGoals: 0.1, expectedAssists: 0.2, starts: 1, tackles: null, clearancesBlocksInterceptions: null,
  recoveries: null, expectedGoalsConceded: null, goalsConceded: 0, ...over,
});

const paid = (over: Partial<PlayerMatch> = {}): PlayerMatch => ({
  opponent: "IPS", home: true, points: 3, minutes: 90, goals: 0, assists: 0,
  shots: 1, shotsOnTarget: 0, foulsCommitted: 2, foulsSuffered: 1, offsides: 0, ...over,
});

describe("joinMatches", () => {
  it("joins on the opponent and the venue", () => {
    const rows = joinMatches(
      [{ match: match(), opponent: CLUBS.get(1) }],
      [paid({ opponent: "IPS", home: true })],
      CLUBS,
    );
    expect(rows[0].paid?.points).toBe(3);
  });

  it("does not join the away match to the home one", () => {
    // The pair is the key precisely because a man plays each opponent twice.
    const rows = joinMatches(
      [{ match: match({ home: false }), opponent: CLUBS.get(1) }],
      [paid({ opponent: "IPS", home: true })],
      CLUBS,
    );
    expect(rows[0].paid).toBeNull();
  });

  it("translates Fantrax's club code before comparing it", () => {
    // Fantrax says NOT where FPL says NFO. Joining on the raw short name would
    // silently miss every Forest fixture.
    const rows = joinMatches(
      [{ match: match({ opponentClubId: 3 }), opponent: CLUBS.get(3) }],
      [paid({ opponent: "NOT", home: true })],
      CLUBS,
    );
    expect(rows[0].paid).not.toBeNull();
  });

  it("keeps every FPL match, joined or not — their history is the spine", () => {
    const rows = joinMatches(
      [
        { match: match({ gameweek: 2, fixtureId: 2, opponentClubId: 2 }), opponent: CLUBS.get(2) },
        { match: match(), opponent: CLUBS.get(1) },
      ],
      [paid({ opponent: "IPS", home: true })],
      CLUBS,
    );
    expect(rows).toHaveLength(2);
    expect(rows[0].paid).toBeNull();
    expect(rows[1].paid).not.toBeNull();
  });

  it("puts our mark against its match by fixture, and null where none was filed", () => {
    const rows = joinMatches(
      [{ match: match({ fixtureId: 7 }), opponent: CLUBS.get(1) }, { match: match({ fixtureId: 8, opponentClubId: 2 }), opponent: CLUBS.get(2) }],
      [],
      CLUBS,
      new Map([[7, 6.8]]),
    );
    expect(rows.map((r) => r.mark)).toEqual([6.8, null]);
  });

  it("survives a match whose opponent the snapshot cannot name", () => {
    const rows = joinMatches([{ match: match({ opponentClubId: 99 }), opponent: undefined }], [paid()], CLUBS);
    expect(rows[0].paid).toBeNull();
  });
});

describe("totalsOf", () => {
  const rows: MatchRow[] = [
    { fpl: { match: match({ goals: 1, minutes: 90, expectedGoals: 0.3 }), opponent: CLUBS.get(1) }, paid: paid({ points: 9, shots: 3 }), mark: null },
    { fpl: { match: match({ gameweek: 2, minutes: 45, expectedGoals: 0.1 }), opponent: CLUBS.get(2) }, paid: null, mark: null },
  ];

  it("sums FPL's columns over every match, whether or not Fantrax reached it", () => {
    expect(totalsOf(rows).minutes).toBe(135);
    expect(totalsOf(rows).goals).toBe(1);
  });

  it("counts an appearance only where he played a minute", () => {
    const unused: MatchRow = { fpl: { match: match({ gameweek: 3, minutes: 0 }), opponent: CLUBS.get(3) }, paid: null, mark: null };
    expect(totalsOf([...rows, unused]).apps).toBe(2);
  });
});

describe("totalsOf's rating", () => {
  const row = (mark: number | null): MatchRow => ({ fpl: { match: match(), opponent: CLUBS.get(1) }, paid: null, mark });

  it("averages the marks he has, passing over the matches without one", () => {
    expect(totalsOf([row(6), row(null), row(8)]).rating).toBe(7);
  });

  it("has no rating when no match was rated", () => {
    expect(totalsOf([row(null)]).rating).toBeNull();
  });
});

describe("totalsOf: goals conceded", () => {
  // Saliba, 8 Oct 2026: not a minute played, Arsenal four down, and the column said 4 where FPL says 0.
  it("adds his own goals conceded, never the club's in a match he sat out", () => {
    const rows = [
      { fpl: { match: match({ minutes: 0, conceded: 1, goalsConceded: null }) } },
      { fpl: { match: match({ minutes: 59, conceded: 3, goalsConceded: 2 }) } },
    ] as unknown as MatchRow[];
    expect(totalsOf(rows).conceded).toBe(2);
  });
});
