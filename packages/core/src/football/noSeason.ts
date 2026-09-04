import type { SeasonTotals } from "./types";

/** A season nobody has played yet — every total at nought.
 *
 *  **For tests and for a fallback, not for a real player.** `mapPlayers` fills
 *  these from FPL, which publishes all eighteen on all 652 elements; this exists
 *  so a fixture building a `FootballPlayer` by hand does not have to write the
 *  eighteen out, and so the five that already did are not five places to keep in
 *  step when a sixteenth is added.
 *
 *  Frozen, because it is shared: a caller mutating the shared blank would give
 *  every other caller his figures. */
export const NO_SEASON: SeasonTotals = Object.freeze({
  goals: 0,
  assists: 0,
  cleanSheets: 0,
  minutes: 0,
  starts: 0,
  expectedGoals: 0,
  expectedAssists: 0,
  expectedGoalsConceded: 0,
  influence: 0,
  creativity: 0,
  threat: 0,
  tackles: 0,
  clearancesBlocksInterceptions: 0,
  recoveries: 0,
  saves: 0,
  goalsConceded: 0,
  bonus: 0,
  bps: 0,
});
