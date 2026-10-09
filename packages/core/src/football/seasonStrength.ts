// A club's attack and defence as this season has gone so far: goals and xG per game against the
// league's, eased in over the first few games. 1.0 is average; a higher defence concedes less.

import { sumOf } from "../sum";
import type { Fixture, PlayerMatchStats } from "./types";

export interface ClubResult {
  club: string;
  kickoff: string;
  goalsFor: number;
  goalsAgainst: number;
  xgFor: number;
  xgAgainst: number;
}

interface SeasonStrengthConfig {
  /** How much of each game's reading is goals rather than xG. */
  goalsShare: number;
  /** Games of league average a club starts with, so its first results move it gently. */
  settleGames: number;
}

/** The weighting the backtest settled on. */
export const STRENGTH_SO_FAR: SeasonStrengthConfig = { goalsShare: 0.5, settleGames: 6 };

interface StrengthSoFar {
  attack: number;
  defence: number;
}

export function strengthBefore(
  results: readonly ClubResult[],
  club: string,
  before: string,
  config: SeasonStrengthConfig,
): StrengthSoFar {
  const blend = (goals: number, xg: number) => config.goalsShare * goals + (1 - config.goalsShare) * xg;
  const earlier = results.filter((r) => r.kickoff < before);
  if (earlier.length === 0) return { attack: 1, defence: 1 };
  const league = sumOf(earlier, (r) => blend(r.goalsFor, r.xgFor)) / earlier.length;
  const own = earlier.filter((r) => r.club === club);
  const settled = (total: number) => (total + config.settleGames * league) / (own.length + config.settleGames);
  const scored = settled(sumOf(own, (r) => blend(r.goalsFor, r.xgFor)));
  const conceded = settled(sumOf(own, (r) => blend(r.goalsAgainst, r.xgAgainst)));
  return { attack: scored / league, defence: league / conceded };
}

/** Every finished fixture from both sides, with each side's xG summed from FPL's per-man rows, one list per gameweek. A
 *  man's xG on a double gameweek arrives as the round's total on both his rows, so it is shared between them. */
export function clubResults(
  fixtures: readonly Fixture[],
  rounds: readonly (readonly PlayerMatchStats[])[],
  clubOf: ReadonlyMap<number, number>,
): ClubResult[] {
  const xg = new Map<string, number>();
  for (const rows of rounds) {
    const fixturesOf = new Map<number, number>();
    for (const row of rows) fixturesOf.set(row.playerId, (fixturesOf.get(row.playerId) ?? 0) + 1);
    for (const row of rows) {
      const key = `${row.fixtureId}|${clubOf.get(row.playerId)}`;
      xg.set(key, (xg.get(key) ?? 0) + row.expectedGoals / (fixturesOf.get(row.playerId) ?? 1));
    }
  }
  return fixtures.flatMap((f) => {
    if (f.status !== "finished" || f.kickoff === null || f.homeScore === null || f.awayScore === null) return [];
    const [home, away] = [xg.get(`${f.id}|${f.homeClubId}`) ?? 0, xg.get(`${f.id}|${f.awayClubId}`) ?? 0];
    return [
      { club: String(f.homeClubId), kickoff: f.kickoff, goalsFor: f.homeScore, goalsAgainst: f.awayScore, xgFor: home, xgAgainst: away },
      { club: String(f.awayClubId), kickoff: f.kickoff, goalsFor: f.awayScore, goalsAgainst: f.homeScore, xgFor: away, xgAgainst: home },
    ];
  });
}
