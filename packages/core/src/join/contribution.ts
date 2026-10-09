import type { PlayerMatchStats } from "../football/types";
import { sumOf } from "../sum";
// What one player has done this gameweek, added up across his matches in it: FPL's counts, never Fantrax's points.
// There is no `played` flag: FPL carries a zero row for every man from the first whistle, so `kickedOff` answers that.

export interface Contribution {
  minutes: number;
  goals: number;
  assists: number;
  /** Only when every match he played in was one; a match not yet kicked off is no evidence either way. */
  cleanSheet: boolean;
  /** The matches he kept one in. */
  cleanSheets: number;
  goalsConceded: number;
  ownGoals: number;
  saves: number;
  penaltiesSaved: number;
  penaltiesMissed: number;
  yellowCards: number;
  redCards: number;
}

export function contribution(stats: readonly PlayerMatchStats[]): Contribution {
  // His appearances: the zero row for a match not yet played must not take Saturday's clean sheet away.
  const appearances = stats.filter((s) => s.minutes > 0);

  return {
    minutes: sumOf(stats, (s) => s.minutes),
    goals: sumOf(stats, (s) => s.goals),
    assists: sumOf(stats, (s) => s.assists),
    cleanSheet: appearances.length > 0 && appearances.every((s) => s.cleanSheet),
    cleanSheets: appearances.filter((s) => s.cleanSheet).length,
    goalsConceded: sumOf(stats, (s) => s.goalsConceded),
    ownGoals: sumOf(stats, (s) => s.ownGoals),
    saves: sumOf(stats, (s) => s.saves),
    penaltiesSaved: sumOf(stats, (s) => s.penaltiesSaved),
    penaltiesMissed: sumOf(stats, (s) => s.penaltiesMissed),
    yellowCards: sumOf(stats, (s) => s.yellowCards),
    redCards: sumOf(stats, (s) => s.redCards),
  };
}
