import { describe, expect, it } from "vitest";
import type { Club, GameLogEntry, PlayerMatch } from "@epl/core";
import { joinMatches, per90, totalsOf } from "./matchRows";
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
  saves: 0, bonus: 0, bps: 20, fplPoints: 6, defensiveContribution: null,
  expectedGoals: 0.1, expectedAssists: 0.2, starts: 1, tackles: null, clearancesBlocksInterceptions: null,
  recoveries: null, expectedGoalsConceded: null, ...over,
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

  it("survives a match whose opponent the snapshot cannot name", () => {
    const rows = joinMatches([{ match: match({ opponentClubId: 99 }), opponent: undefined }], [paid()], CLUBS);
    expect(rows[0].paid).toBeNull();
  });
});

describe("totalsOf", () => {
  const rows: MatchRow[] = [
    { fpl: { match: match({ goals: 1, minutes: 90, bps: 30 }), opponent: CLUBS.get(1) }, paid: paid({ points: 9, shots: 3 }) },
    { fpl: { match: match({ gameweek: 2, minutes: 45, bps: 10 }), opponent: CLUBS.get(2) }, paid: null },
  ];

  it("sums FPL's columns over every match", () => {
    expect(totalsOf(rows).minutes).toBe(135);
    expect(totalsOf(rows).goals).toBe(1);
    expect(totalsOf(rows).bps).toBe(40);
  });

  it("sums Fantrax's only over the matches they reached", () => {
    // A season sum would count a match nobody showed us as a nought.
    expect(totalsOf(rows).points).toBe(9);
    expect(totalsOf(rows).shots).toBe(3);
  });

  it("says nothing rather than nought when Fantrax reached none of them", () => {
    const none: MatchRow[] = [{ fpl: rows[0].fpl, paid: null }];
    expect(totalsOf(none).points).toBeNull();
    expect(totalsOf(none).shots).toBeNull();
  });
});

describe("per90", () => {
  it("rates a total over the minutes behind it", () => {
    expect(per90(2, 180)).toBe(1);
  });

  it("does not divide by nought", () => {
    expect(per90(0, 0)).toBeNull();
    expect(per90(5, 0)).toBeNull();
  });

  it("has no rate for a total it was not given", () => {
    expect(per90(null, 900)).toBeNull();
  });
});
