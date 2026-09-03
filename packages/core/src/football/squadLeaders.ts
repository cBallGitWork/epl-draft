import type { FootballPlayer, SeasonTotals } from "./types";

// Who is carrying a club's season, one measure at a time.
//
// Pure, and here rather than in a page because it is asked six times on one
// screen and the tiebreak has to be the same answer every time. "Top scorer" is
// a claim about a squad, not a sort order a component invents.

/** A measure a squad can have a leader in. Every one is a plain count on
 *  `SeasonTotals`, so the caller names the field and this does the rest. */
export type LeaderKey = keyof {
  [K in keyof SeasonTotals as SeasonTotals[K] extends number ? K : never]: true;
};

export interface Leader {
  player: FootballPlayer;
  value: number;
}

/** The squad's leader in one measure, or null when nobody has any of it.
 *
 *  **Null and not a nought-scoring man.** Before a ball is kicked every player
 *  has nought goals, and naming one of them "top scorer" is a confident wrong
 *  statement the reader cannot check — DESIGN §7's rule about absence, applied
 *  to a claim rather than to a figure.
 *
 *  Ties break on minutes and then on name: minutes because the man who did it in
 *  fewer is the more notable of two, and name so the answer is stable between
 *  renders. A leaderboard that reorders on refresh is one nobody trusts. */
export function squadLeader(
  players: readonly FootballPlayer[],
  key: LeaderKey,
): Leader | null {
  let best: Leader | null = null;
  for (const player of players) {
    const value = player.season[key];
    if (value <= 0) continue;
    if (
      best === null ||
      value > best.value ||
      (value === best.value &&
        (player.season.minutes < best.player.season.minutes ||
          (player.season.minutes === best.player.season.minutes &&
            player.name.localeCompare(best.player.name) < 0)))
    ) {
      best = { player, value };
    }
  }
  return best;
}
