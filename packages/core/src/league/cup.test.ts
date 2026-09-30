import { describe, expect, it } from "vitest";
import { type Draw, seededTies } from "./competitions";
import { CUP, CUP_ROUNDS } from "./cup";

const ties = CUP_ROUNDS.flatMap((round) => round.ties.map((tie) => ({ ...tie, gameweek: round.gameweek })));
const sides = ties.flatMap((tie) => [tie.home, tie.away]);
const gameweeks = [...new Set(CUP_ROUNDS.map((round) => round.gameweek))];

const teams = Array.from({ length: 10 }, (_, at) => ({ teamId: `t${at + 1}`, name: `Seed ${at + 1}` }));
const seeds = new Map(teams.map((team, at) => [at + 1, team]));

/** Every gameweek finished, each team scoring `score(seed)` every week. */
const played = (score: (seed: number) => number): Draw => ({
  seeds: () => seeds,
  totals: () => new Map(teams.map((team, at) => [team.teamId, score(at + 1)])),
});

describe("the cup's declaration", () => {
  it("is eighteen ties over gameweeks 10 to 17, after a seeding gameweek 9", () => {
    expect(ties).toHaveLength(18);
    expect(CUP.seededBy).toEqual({ gameweek: 9 });
    expect([Math.min(...gameweeks), Math.max(...gameweeks)]).toEqual([10, 17]);
  });

  it("names every tie once", () => {
    expect(new Set(ties.map((tie) => tie.id)).size).toBe(ties.length);
  });

  it("draws every seed exactly once", () => {
    const numbered = sides.filter((side) => typeof side === "number").sort((a, b) => a - b);
    expect(numbered).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it("only ever refers back to a tie already played", () => {
    for (const tie of ties) {
      for (const side of [tie.home, tie.away]) {
        if (typeof side === "number") continue;
        const id = "winner" in side ? side.winner : side.loser;
        expect(ties.find((earlier) => earlier.id === id)?.gameweek).toBeLessThan(tie.gameweek);
      }
    }
  });

  it("sends each tie's winner on once, and each winners' bracket loser down once", () => {
    const winners = sides.flatMap((side) => (typeof side === "object" && "winner" in side ? [side.winner] : []));
    const losers = sides.flatMap((side) => (typeof side === "object" && "loser" in side ? [side.loser] : []));
    expect(new Set(winners).size).toBe(winners.length);
    expect(new Set(losers).size).toBe(losers.length);
    expect(winners).toHaveLength(ties.length - 1);
    expect(losers).toHaveLength(9);
  });
});

describe("the cup, played through", () => {
  it.each([
    ["the favourites win every tie", (seed: number) => 100 - seed],
    ["the underdogs win every tie", (seed: number) => seed],
  ])("gives no team two ties in one gameweek when %s", (_, score) => {
    for (const gameweek of gameweeks) {
      const named = seededTies(CUP_ROUNDS, gameweek, played(score)).flatMap((tie) => [tie.home.team, tie.away.team]);
      expect(named.every((team) => team !== null)).toBe(true);
      expect(new Set(named.map((team) => team?.teamId)).size).toBe(named.length);
    }
  });

  it("brings the top two seeds to the final when the favourites win every tie", () => {
    const [final] = seededTies(CUP_ROUNDS, 17, played((seed) => 100 - seed));
    expect([final?.home.label, final?.away.label]).toEqual(["Seed 1", "Seed 2"]);
  });
});
