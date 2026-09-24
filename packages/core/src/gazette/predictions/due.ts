import { PREDICTIONS } from "../../config";
import { instantOf, londonDayOf, londonTime, londonWeekday } from "../../time";

// When Lawro's column is due: the Thursday evening before the round, or the evening before a lock
// that falls earlier in the week. It stays open until the lock, so a skipped evening catches up.

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MS_PER_DAY = 86_400_000;

/** The London day the column files for a round locking at `locksAt`, as `YYYY-MM-DD`. */
export function filingDay(locksAt: string): string | null {
  const lockDay = londonDayOf(locksAt);
  const weekday = WEEKDAYS.indexOf(londonWeekday(locksAt));
  if (lockDay === null || weekday < 0) return null;
  const { weekday: filing, maxLeadDays } = PREDICTIONS.filing;
  const back = ((weekday - filing + 6) % 7) + 1;
  return dayBefore(lockDay, back <= maxLeadDays ? back : 1);
}

/** Whether the column is due at `now` for a round locking at `locksAt`. */
export function predictionsDue(locksAt: string, now: string): boolean {
  const lock = instantOf(locksAt);
  const at = instantOf(now);
  const day = filingDay(locksAt);
  const today = londonDayOf(now);
  if (lock === null || at === null || at >= lock || day === null || today === null) return false;
  return today > day || (today === day && Number(londonTime(now).slice(0, 2)) >= PREDICTIONS.filing.hour);
}

/** A calendar day `days` earlier, in plain date arithmetic: no clock and no zone. */
function dayBefore(day: string, days: number): string {
  const [year, month, date] = day.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, date) - days * MS_PER_DAY).toISOString().slice(0, 10);
}
