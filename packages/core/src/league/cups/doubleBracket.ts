import { pairUp, playAmong, seedSlots, type BracketRound, type Slot } from "./bracket";

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

  const opening = keep(playAmong("W1", seedSlots(entrants)));
  let winners: Slot[] = opening.winners;
  let losers: Slot[] = keep(playAmong("L1", opening.losers)).winners;

  for (let round = 2; winners.length > 1; round++) {
    const played = keep(playAmong(`W${round}`, winners));
    winners = played.winners;
    // Reversed so a team dropping down does not at once meet a side it knocked down earlier.
    losers = keep(pairUp(`L${2 * round - 2}`, losers, [...played.losers].reverse())).winners;
    if (losers.length > 1) losers = keep(playAmong(`L${2 * round - 1}`, losers)).winners;
  }

  keep(pairUp("F", winners, losers));
  return rounds;
}
