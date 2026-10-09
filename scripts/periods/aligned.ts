import type { PeriodGameweeks } from "@epl/core";

// period-alignment's verdict on one period: a rearranged fixture leaves it blank or adds a second gameweek.

/** Whether the period holds exactly its own gameweek and no other. */
export function holdsOnlyItsOwn({ period, gameweeks }: PeriodGameweeks): boolean {
  return gameweeks.length === 1 && gameweeks[0] === period;
}
