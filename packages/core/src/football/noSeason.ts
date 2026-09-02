import type { SeasonTotals } from "./types";

/** A season nobody has played yet — every total at nought.
 *
 *  **For tests and for a fallback, not for a real player.** `mapPlayers` fills
 *  these from FPL, which publishes all twelve on all 629 elements; this exists
 *  so a fixture building a `FootballPlayer` by hand does not have to write the
 *  twelve out, and so the five that already did are not five places to keep in
 *  step when a thirteenth is added.
 *
 *  Frozen, because it is shared: a caller mutating the shared blank would give
 *  every other caller his figures. */
export const NO_SEASON: SeasonTotals = Object.freeze({
  minutes: 0,
  starts: 0,
  expectedGoals: 0,
  expectedAssists: 0,
  expectedGoalsConceded: 0,
  tackles: 0,
  clearancesBlocksInterceptions: 0,
  recoveries: 0,
  saves: 0,
  goalsConceded: 0,
  bonus: 0,
  bps: 0,
});
