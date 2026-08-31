import { describe, expect, it } from "vitest";
import type { PlayerMatchStats } from "../../football/types";
import { buildMatchReportBrief, statLine } from "./matchReport";

const stats = (over: Partial<PlayerMatchStats> = {}): PlayerMatchStats => ({
  playerId: 1,
  fixtureId: 1,
  minutes: 90,
  goals: 0,
  assists: 0,
  cleanSheet: false,
  goalsConceded: 0,
  ownGoals: 0,
  penaltiesSaved: 0,
  penaltiesMissed: 0,
  yellowCards: 0,
  redCards: 0,
  saves: 0,
  bonus: 0,
  bps: 0,
  defensiveContribution: 0,
  expectedGoals: 0,
  expectedAssists: 0,
  ...over,
});

describe("statLine", () => {
  it("puts minutes first so a cameo reads as one, and a blank reads as one", () => {
    expect(statLine(stats({ minutes: 7 }))).toBe("7 min");
    expect(statLine(stats({ goals: 2, assists: 1, bonus: 3 }))).toBe("90 min, 2G, 1A, 3 bonus");
  });

  it("prints a sending-off instead of the booking that came with it", () => {
    expect(statLine(stats({ yellowCards: 1, redCards: 1 }))).toContain("sent off");
    expect(statLine(stats({ yellowCards: 1, redCards: 1 }))).not.toContain("booked");
  });
});

describe("buildMatchReportBrief", () => {
  const brief = buildMatchReportBrief({
    gameweek: 3,
    home: "Arsenal",
    away: "Aston Villa",
    homeScore: 2,
    awayScore: 1,
    owners: [{ owner: "test2", players: [{ name: "Saka", position: "M", stats: stats({ goals: 1 }) }] }],
    ties: [
      { homeName: "test2", awayName: "test3", homePoints: 41, awayPoints: 39, state: "open" },
    ],
    threads: [],
  });

  it("hands the writer the score, the men by owner, and the ties as they stand", () => {
    expect(brief).toContain("Arsenal 2–1 Aston Villa");
    expect(brief).toContain("test2:\n- Saka (M): 90 min, 1G");
    expect(brief).toContain("test2 41 v 39 test3, still open");
  });

  it("states the two rules at the point of temptation", () => {
    // You do not know how the football happened, and an open tie gets
    // consequence, never a verdict.
    expect(brief).toContain("you do not know the order anything happened");
    expect(brief).toContain("never verdicts");
  });
});
