import type { PlayerMatchStats } from "../football/types";

// What one player has actually done this round, added up across however many
// matches he played in it.
//
// Here rather than in the component that used to hold it, for two reasons. It is
// arithmetic over football data, which §5 puts in core; and it now has two
// readers — the sticker on the pitch and the row in the list — which had begun
// summing the same fields two different ways.
//
// Fantrax's own points are deliberately absent. `getTeamRosters` does not carry
// them, their live scoreboard publishes no per-player total we can read, and we
// do not recompute their scoring. So this is the countable events and the
// minutes, which is what we genuinely know.

export interface Contribution {
  /** True once he has appeared at all. Distinct from `minutes === 0`, which is
   *  also what a named substitute who never came on reads as. */
  played: boolean;
  minutes: number;
  goals: number;
  assists: number;
  /** Only when every match he played in was a clean sheet. A defender who kept
   *  one and conceded in the other kept none. */
  cleanSheet: boolean;
  saves: number;
  yellowCards: number;
  redCards: number;
}

export function contribution(stats: readonly PlayerMatchStats[]): Contribution {
  const sum = (pick: (s: PlayerMatchStats) => number) => stats.reduce((n, s) => n + pick(s), 0);

  return {
    played: stats.length > 0,
    minutes: sum((s) => s.minutes),
    goals: sum((s) => s.goals),
    assists: sum((s) => s.assists),
    cleanSheet: stats.length > 0 && stats.every((s) => s.cleanSheet),
    saves: sum((s) => s.saves),
    yellowCards: sum((s) => s.yellowCards),
    redCards: sum((s) => s.redCards),
  };
}
