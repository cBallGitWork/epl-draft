import type { BracketRound, BracketSide } from "./bracket";

/** Each round's gameweek, one a round, counted back from the final. A round follows every round it
 *  draws a side from, and rounds that do not wait on each other share a gameweek. */
export function scheduleRounds(rounds: readonly BracketRound[], finalGameweek: number): Map<string, number> {
  const levels = roundLevels(rounds);
  const deepest = Math.max(0, ...levels.values());
  return new Map(rounds.map((round) => [round.id, finalGameweek - deepest + (levels.get(round.id) ?? 0)]));
}

/** How many rounds deep each round sits: one more than the deepest round it draws a side from. */
function roundLevels(rounds: readonly BracketRound[]): Map<string, number> {
  const roundOfTie = new Map<string, string>();
  const levels = new Map<string, number>();
  for (const round of rounds) {
    const drawnFrom = round.ties.flatMap((tie) => [tie.home, tie.away]).map((side) => {
      const tie = tieOf(side);
      return tie === null ? 0 : (levels.get(roundOfTie.get(tie) ?? "") ?? 0);
    });
    levels.set(round.id, 1 + Math.max(0, ...drawnFrom));
    for (const tie of round.ties) roundOfTie.set(tie.id, round.id);
  }
  return levels;
}

function tieOf(side: BracketSide): string | null {
  if ("winnerOf" in side) return side.winnerOf;
  if ("loserOf" in side) return side.loserOf;
  return null;
}
