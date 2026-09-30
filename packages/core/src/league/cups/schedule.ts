import type { BracketRound, BracketSide } from "./bracket";

/** Each round's gameweek, one a round, as late as the final allows: the gameweek before the first round
 *  that draws a side from it, so no winner waits longer for his next tie than the bracket forces. */
export function scheduleRounds(rounds: readonly BracketRound[], finalGameweek: number): Map<string, number> {
  const roundOfTie = new Map(rounds.flatMap((round) => round.ties.map((tie) => [tie.id, round.id] as const)));
  const drawnBy = new Map<string, string[]>();
  for (const round of rounds) {
    for (const side of round.ties.flatMap((tie) => [tie.home, tie.away])) {
      const from = roundOfTie.get(tieOf(side) ?? "");
      if (from !== undefined) drawnBy.set(from, [...(drawnBy.get(from) ?? []), round.id]);
    }
  }

  // Rounds arrive in drawing order, so walking them backwards meets every round after those it feeds.
  const gameweeks = new Map<string, number>();
  for (const round of [...rounds].reverse()) {
    const next = (drawnBy.get(round.id) ?? []).map((id) => gameweeks.get(id) ?? finalGameweek + 1);
    gameweeks.set(round.id, next.length === 0 ? finalGameweek : Math.min(...next) - 1);
  }
  return gameweeks;
}

function tieOf(side: BracketSide): string | null {
  if ("winnerOf" in side) return side.winnerOf;
  if ("loserOf" in side) return side.loserOf;
  return null;
}
