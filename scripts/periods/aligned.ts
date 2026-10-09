import type { PeriodGameweeks } from "@epl/core";

// period-alignment's verdict on one period: a rearranged fixture leaves it blank or adds a second gameweek.

/** Whether the period holds exactly its own gameweek (`own`) and no other; the league numbers periods, not FPL. */
export function holdsOnlyItsOwn({ gameweeks, own }: PeriodGameweeks): boolean {
  return gameweeks.length === 1 && gameweeks[0] === own;
}
