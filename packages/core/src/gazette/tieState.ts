import type { LiveTeamScore } from "../league/points";

// Whether a head-to-head is still a contest, in two honest tiers.
//
// A paper that calls a tie "done" is making a call, and a call needs a rule it
// can be held to. Both thresholds are SHARES of the leader's total, never point
// counts — `stories.ts` records why: point counts bake this league's scoring
// scale into a judgement that should survive a commissioner changing it.

export type TieState = "open" | "probable" | "settled";

/** A lead this share of the leader's total, with the men below still to come,
 *  is a tie the paper may call "all but done". A quarter is an argued line: at
 *  typical weekly totals it is a two-score lead, and two men rarely make one
 *  score, let alone two. */
export const PROBABLE_SHARE = 0.25;

/** How many men the trailing side may still have coming for the call to be
 *  made at all. Three or more and the paper keeps its mouth shut whatever the
 *  margin — a bench-boost of a Sunday can be worth a score on its own. */
export const PROBABLE_TO_PLAY = 2;

/** One tie's state. `toPlay` null is "they did not say", which can never
 *  support a call — the rule three screens have already relearned. */
export function tieState(
  home: LiveTeamScore | undefined,
  away: LiveTeamScore | undefined,
): TieState {
  const homePoints = home?.points ?? null;
  const awayPoints = away?.points ?? null;
  if (homePoints === null || awayPoints === null || homePoints === awayPoints) return "open";

  const [leader, trailer] =
    homePoints > awayPoints ? [home, away] : [away, home];
  const margin = Math.abs(homePoints - awayPoints);
  const leaderPoints = leader?.points ?? 0;
  const left = trailer?.toPlay ?? null;
  if (left === null) return "open";

  // Nobody left and behind: decided in all but the negative-points theoretical,
  // and the paper says "all but", never "won", until Fantrax says so.
  if (left === 0) return "settled";
  if (left <= PROBABLE_TO_PLAY && leaderPoints > 0 && margin >= leaderPoints * PROBABLE_SHARE) {
    return "probable";
  }
  return "open";
}
