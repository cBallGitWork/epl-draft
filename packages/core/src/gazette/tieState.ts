import type { LiveTeamScore } from "../league/points";

// Whether a head-to-head is still a contest; thresholds are shares of the leader's total, never points.

export type TieState = "open" | "probable" | "settled";

/** A lead of this share of the leader's total, with few enough men to come, is "all but done". */
const PROBABLE_SHARE = 0.25;

/** The most men the trailing side may have still to play for the call to be made at all. */
const PROBABLE_TO_PLAY = 2;

/** One tie's state; a null `toPlay` is "not said", never nought, and supports no call. */
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

  // Nobody left to play: settled, though the paper says "all but", never "won", until Fantrax does.
  if (left === 0) return "settled";
  if (left <= PROBABLE_TO_PLAY && leaderPoints > 0 && margin >= leaderPoints * PROBABLE_SHARE) {
    return "probable";
  }
  return "open";
}
