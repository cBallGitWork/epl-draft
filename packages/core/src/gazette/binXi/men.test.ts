import { describe, expect, it } from "vitest";
import type { FootballPlayer, PlayerMatchStats } from "../../football/types";
import type { PlayerStatLine } from "../../league/fantrax/playerStats";
import { binMen, fplWeeks } from "./men";

function row(playerId: number, fixtureId: number, more: Partial<PlayerMatchStats> = {}): PlayerMatchStats {
  return {
    playerId, fixtureId, minutes: 90, goals: 0, assists: 0, cleanSheet: false, goalsConceded: 0, ownGoals: 0, penaltiesSaved: 0,
    penaltiesMissed: 0, yellowCards: 0, redCards: 0, saves: 0, expectedGoals: 0,
    expectedAssists: 0, starts: 1, fplPoints: 0, ...more,
  };
}

function line(fantraxId: string, points: number | null, defaultPosition: string | null, stats: Record<string, number | null> = {}): PlayerStatLine {
  return { fantraxId, name: `Man ${fantraxId}`, club: null, clubShort: null, position: defaultPosition, ownerTeamId: null, defaultPosition, points, stats };
}

const footballer = (id: number, code: number) => ({ id, code, clubId: 7 }) as FootballPlayer;

describe("fplWeeks", () => {
  it("adds a double gameweek's matches, and keeps a clean sheet only if he kept one in each", () => {
    const weeks = fplWeeks([row(1, 10, { goals: 1, cleanSheet: true, expectedGoals: 0.4 }), row(1, 11, { expectedGoals: 0.3 })], () => true);
    expect(weeks.get(1)).toMatchObject({ minutes: 180, goals: 1, cleanSheet: false });
    expect(weeks.get(1)?.expectedGoals).toBeCloseTo(0.7);
  });

  it("leaves out a match outside the window and a row for a match he did not play", () => {
    const weeks = fplWeeks([row(1, 10), row(1, 99, { goals: 3 }), row(2, 10, { minutes: 0, starts: 0 })], (fixtureId) => fixtureId !== 99);
    expect(weeks.get(1)?.goals).toBe(0);
    expect(weeks.has(2)).toBe(false);
  });

  it("counts a substitute's minutes without a start", () => {
    expect(fplWeeks([row(1, 10, { minutes: 12, starts: 0 })], () => true).get(1)?.started).toBe(false);
  });
});

describe("binMen", () => {
  const weeks = fplWeeks([row(100, 10, { goals: 1, cleanSheet: true, saves: 0 })], () => true);
  const sheet = new Map([["a", line("a", 0, "D", { S: 2, SOT: 1, KP: 1, TkW: 0, Int: 2, CLR: null })]]);
  const player = (fantraxId: string) => (fantraxId === "a" ? footballer(100, 5001) : fantraxId === "b" ? footballer(200, 5002) : null);

  it("joins his Fantrax points and position to his football and his shots, by id", () => {
    const { men, extras } = binMen({ pool: [line("a", 12, "D")], sheet, player, weeks });
    expect(men).toEqual([expect.objectContaining({ fantraxId: "a", code: 5001, position: "D", points: 12, goals: 1, shots: 2, shotsOnTarget: 1, chancesCreated: 1 })]);
    expect(extras.get("a")).toEqual({ cleanSheet: true, saves: 0, tacklesWon: 0, interceptions: 2, clearances: null });
  });

  it("reports a scorer it could not join, and passes over a man who did not play", () => {
    const { men, unjoined } = binMen({ pool: [line("x", 6, "M"), line("b", 0, "F"), line("c", 3, null)], sheet, player, weeks });
    expect(men).toEqual([]);
    expect(unjoined).toEqual(["Man x"]);
  });

  it("carries nulls, never noughts, when the stats league did not answer", () => {
    const { men } = binMen({ pool: [line("a", 12, "D")], sheet: new Map(), player, weeks });
    expect(men[0]).toMatchObject({ shots: null, shotsOnTarget: null, chancesCreated: null });
  });
});
