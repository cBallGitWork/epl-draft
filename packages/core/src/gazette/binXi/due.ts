import { BIN_XI } from "../../config";
import { londonWeekday } from "../../time";

/** Whether the Bin XI files at `now`: Tuesday in London, the one day with no league event. */
export function binXiDue(now: string): boolean {
  return londonWeekday(now) === BIN_XI.weekday;
}
