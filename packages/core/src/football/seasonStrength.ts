// A club's attack and defence as this season has gone so far: goals and xG per game against the
// league's, eased in over the first few games. 1.0 is average; a higher defence concedes less.

export interface ClubResult {
  club: string;
  kickoff: string;
  goalsFor: number;
  goalsAgainst: number;
  xgFor: number;
  xgAgainst: number;
}

export interface SeasonStrengthConfig {
  /** How much of each game's reading is goals rather than xG. */
  goalsShare: number;
  /** Games of league average a club starts with, so its first results move it gently. */
  settleGames: number;
}

export interface StrengthSoFar {
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
  const league = earlier.reduce((sum, r) => sum + blend(r.goalsFor, r.xgFor), 0) / earlier.length;
  const own = earlier.filter((r) => r.club === club);
  const settled = (total: number) => (total + config.settleGames * league) / (own.length + config.settleGames);
  const scored = settled(own.reduce((sum, r) => sum + blend(r.goalsFor, r.xgFor), 0));
  const conceded = settled(own.reduce((sum, r) => sum + blend(r.goalsAgainst, r.xgAgainst), 0));
  return { attack: scored / league, defence: league / conceded };
}
