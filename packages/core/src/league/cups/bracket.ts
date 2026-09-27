/** A seed (1 is the best), or the winner of a tie, by its index in the round before. */
export type BracketSide = { seed: number } | { winnerOf: number };

export type BracketTie = readonly [BracketSide, BracketSide];

/** A knockout for any number of entrants, first round to final. Short of a power of two, the top
 *  seeds take the byes, and seeds 1 and 2 cannot meet before the final. */
export function seededBracket(entrants: number): BracketTie[][] {
  let slots: (BracketSide | null)[] = slotOrder(entrants).map((seed) =>
    seed <= entrants ? { seed } : null,
  );
  const rounds: BracketTie[][] = [];

  while (slots.length > 1) {
    const ties: BracketTie[] = [];
    const next: (BracketSide | null)[] = [];
    for (let at = 0; at < slots.length; at += 2) {
      const home = slots[at] ?? null;
      const away = slots[at + 1] ?? null;
      if (home && away) {
        next.push({ winnerOf: ties.length });
        ties.push([home, away]);
      } else {
        next.push(home ?? away);
      }
    }
    if (ties.length > 0) rounds.push(ties);
    slots = next;
  }
  return rounds;
}

/** Seeds in bracket order for the smallest power of two that holds everyone: 1 8 4 5 2 7 3 6. */
function slotOrder(entrants: number): number[] {
  let order = [1];
  while (order.length < entrants) {
    const size = order.length * 2;
    order = order.flatMap((seed) => [seed, size + 1 - seed]);
  }
  return order;
}
