import { evens, odds, pairUp, seedSlots, type BracketRound, type Slot } from "./bracket";

/** A double-elimination knockout: a first defeat drops a team into the losers' bracket, a second
 *  puts it out. The two brackets' winners meet once in the final, with no reset if the winners'
 *  side loses it. Rounds come in the order their ties can be settled. */
export function doubleBracket(entrants: number): BracketRound[] {
  if (entrants < 2) return [];
  const rounds: BracketRound[] = [];
  const keep = (played: ReturnType<typeof pairUp>) => {
    if (played.round.ties.length > 0) rounds.push(played.round);
    return played;
  };

  const opening = keep(pairUp("W1", evens(seedSlots(entrants)), odds(seedSlots(entrants))));
  let winners: Slot[] = opening.winners;
  let losers: Slot[] = keep(pairUp("L1", evens(opening.losers), odds(opening.losers))).winners;

  for (let round = 2; winners.length > 1; round++) {
    const played = keep(pairUp(`W${round}`, evens(winners), odds(winners)));
    winners = played.winners;
    // Reversed so a team dropping down does not meet the side it has just knocked down.
    losers = keep(pairUp(`L${2 * round - 2}`, losers, [...played.losers].reverse())).winners;
    if (losers.length > 1) losers = keep(pairUp(`L${2 * round - 1}`, evens(losers), odds(losers))).winners;
  }

  keep(pairUp("F", winners, losers));
  return rounds;
}
