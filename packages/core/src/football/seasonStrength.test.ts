import { describe, expect, it } from "vitest";
import { clubResults, strengthBefore } from "./seasonStrength";
import type { ClubResult } from "./seasonStrength";
import type { Fixture, PlayerMatchStats } from "./types";

const CONFIG = { goalsShare: 0.5, settleGames: 6 };

/** Week after week: A scores three and keeps a clean sheet, B the reverse, C and D draw at the league average of 1.5. */
const season: ClubResult[] = Array.from({ length: 10 }, (_, i) => {
  const kickoff = `2025-09-${String(i + 1).padStart(2, "0")}T15:00:00Z`;
  return [
    { club: "A", kickoff, goalsFor: 3, goalsAgainst: 0, xgFor: 3, xgAgainst: 0 },
    { club: "B", kickoff, goalsFor: 0, goalsAgainst: 3, xgFor: 0, xgAgainst: 3 },
    { club: "C", kickoff, goalsFor: 1.5, goalsAgainst: 1.5, xgFor: 1.5, xgAgainst: 1.5 },
    { club: "D", kickoff, goalsFor: 1.5, goalsAgainst: 1.5, xgFor: 1.5, xgAgainst: 1.5 },
  ];
}).flat();

describe("strengthBefore", () => {
  it("knows nothing before a ball is kicked", () => {
    expect(strengthBefore(season, "A", "2025-08-01T00:00:00Z", CONFIG)).toEqual({ attack: 1, defence: 1 });
  });

  it("ranks the side that scores most as the strongest attack and the leakiest as the weakest defence", () => {
    const a = strengthBefore(season, "A", "2025-10-01T00:00:00Z", CONFIG);
    const b = strengthBefore(season, "B", "2025-10-01T00:00:00Z", CONFIG);
    expect(a.attack).toBeGreaterThan(1.5);
    expect(a.defence).toBeGreaterThan(1.5);
    expect(b.attack).toBeLessThan(0.7);
    expect(b.defence).toBeLessThan(0.7);
  });

  it("only counts matches kicked off before the one being rated", () => {
    const early = strengthBefore(season, "A", "2025-09-02T00:00:00Z", CONFIG);
    const late = strengthBefore(season, "A", "2025-10-01T00:00:00Z", CONFIG);
    expect(early.attack).toBeLessThan(late.attack);
  });

  it("eases in, so one big game does not make a side great", () => {
    expect(strengthBefore(season, "A", "2025-09-02T00:00:00Z", CONFIG).attack).toBeLessThan(1.5);
  });

  it("keeps an average side at average", () => {
    const c = strengthBefore(season, "C", "2025-10-01T00:00:00Z", CONFIG);
    expect(c.attack).toBeCloseTo(1, 1);
    expect(c.defence).toBeCloseTo(1, 1);
  });
});

describe("clubResults", () => {
  const fixture = (id: number, home: number, away: number, score: [number, number] | null): Fixture => ({
    id, code: id, gameweek: 1, homeClubId: home, awayClubId: away, kickoff: "2026-08-22T14:00:00Z",
    homeScore: score?.[0] ?? null, awayScore: score?.[1] ?? null, status: score === null ? "upcoming" : "finished",
    settled: score !== null, minutes: 90, homeDifficulty: null, awayDifficulty: null,
  });
  const row = (playerId: number, fixtureId: number, expectedGoals: number) => ({ playerId, fixtureId, expectedGoals }) as PlayerMatchStats;
  const clubOf = new Map([[1, 10], [2, 20], [3, 10]]);

  it("gives each finished fixture from both sides, with each side's xG summed", () => {
    const results = clubResults([fixture(100, 10, 20, [2, 1])], [[row(1, 100, 0.6), row(3, 100, 0.4), row(2, 100, 0.7)]], clubOf);
    expect(results).toHaveLength(2);
    expect(results[0]).toMatchObject({ club: "10", goalsFor: 2, goalsAgainst: 1, xgFor: 1, xgAgainst: 0.7 });
    expect(results[1]).toMatchObject({ club: "20", goalsFor: 1, xgFor: 0.7, xgAgainst: 1 });
  });

  it("shares a man's double-gameweek xG between his two matches, and skips what is unplayed", () => {
    const results = clubResults(
      [fixture(100, 10, 20, [1, 0]), fixture(101, 20, 10, [0, 0]), fixture(102, 10, 20, null)],
      [[row(1, 100, 1.0), row(1, 101, 1.0)]],
      clubOf,
    );
    expect(results).toHaveLength(4);
    expect(results.find((r) => r.club === "10" && r.goalsFor === 1)?.xgFor).toBeCloseTo(0.5);
  });
});
