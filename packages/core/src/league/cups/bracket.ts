/** A seed (1 is the best), or whoever wins or loses an earlier tie, by that tie's id. */
export type BracketSide = { seed: number } | { winnerOf: string } | { loserOf: string };

export interface BracketTie {
  /** "W2-1": the winners' bracket, round 2, tie 1. "L" is the losers' bracket and "F" the final. */
  id: string;
  home: BracketSide;
  away: BracketSide;
}

export interface BracketRound {
  id: string;
  ties: BracketTie[];
}

/** A slot nobody fills: a bye, or the loser of a tie that was never played. */
export type Slot = BracketSide | null;

/** A single-elimination knockout, first round to final, with the top seeds on byes. */
export function seededBracket(entrants: number): BracketRound[] {
  let slots = seedSlots(entrants);
  const rounds: BracketRound[] = [];
  for (let round = 1; slots.length > 1; round++) {
    const played = playAmong(`W${round}`, slots);
    if (played.round.ties.length > 0) rounds.push(played.round);
    slots = played.winners;
  }
  return rounds;
}

/** Seeds in bracket order for the smallest power of two that holds everyone (1 8 4 5 2 7 3 6), so
 *  seeds 1 and 2 cannot meet before the final. A place past the last entrant is a bye. */
export function seedSlots(entrants: number): Slot[] {
  let order = [1];
  while (order.length < entrants) {
    const size = order.length * 2;
    order = order.flatMap((seed) => [seed, size + 1 - seed]);
  }
  return order.map((seed) => (seed <= entrants ? { seed } : null));
}

/** Plays `home[i]` against `away[i]`. A side facing nobody goes through without a tie. */
export function pairUp(
  roundId: string,
  home: readonly Slot[],
  away: readonly Slot[],
): { round: BracketRound; winners: Slot[]; losers: Slot[] } {
  const round: BracketRound = { id: roundId, ties: [] };
  const winners: Slot[] = [];
  const losers: Slot[] = [];
  for (let at = 0; at < Math.max(home.length, away.length); at++) {
    const homeSide = home[at] ?? null;
    const awaySide = away[at] ?? null;
    if (homeSide && awaySide) {
      const id = `${roundId}-${round.ties.length + 1}`;
      round.ties.push({ id, home: homeSide, away: awaySide });
      winners.push({ winnerOf: id });
      losers.push({ loserOf: id });
    } else {
      winners.push(homeSide ?? awaySide);
      losers.push(null);
    }
  }
  return { round, winners, losers };
}

/** Plays neighbours in the bracket against each other: first against second, third against fourth. */
export function playAmong(roundId: string, slots: readonly Slot[]): ReturnType<typeof pairUp> {
  return pairUp(
    roundId,
    slots.filter((_, at) => at % 2 === 0),
    slots.filter((_, at) => at % 2 === 1),
  );
}
