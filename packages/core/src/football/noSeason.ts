import type { SeasonTotals } from "./types";

/** A season nobody has played yet, every total at nought: for tests and fallbacks; frozen because it is shared. */
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
});
