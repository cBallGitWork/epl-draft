import { FANTRAX_LEAGUE_ID, minimumsOf } from "@epl/core";
import limits from "../../../data/leagues/roster-limits.json";

// The fewest players this league may start at each position, for the planner: Fantrax's API carries only `maxActive`,
// so `scripts/roster-limits.ts` reads the commissioner's setup page into the file. Empty, so no floor, until it has.

/** What the league insists on, by position letter. */
export function rosterMinimums(): Record<string, number> {
  return minimumsOf(limits, FANTRAX_LEAGUE_ID) ?? {};
}
