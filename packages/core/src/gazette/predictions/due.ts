import { PREDICTIONS } from "../../config";
import { MS_PER_DAY, instantOf, londonDayOf, londonTime, londonWeekday } from "../../time";

// When Lawro's column is due: the Thursday evening before the round, or the evening before a lock
// that falls earlier in the week. It stays open until the lock, so a skipped evening catches up.

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** A weekday and London hour a look-ahead files at, and how many days before the lock that weekday may fall. */
export type Filing = { weekday: number; hour: number; maxLeadDays: number };

/** The London day a column files for a round locking at `locksAt`, as `YYYY-MM-DD`. */
export function filingDay(locksAt: string, filing: Filing = PREDICTIONS.filing): string | null {
  const lockDay = londonDayOf(locksAt);
  const weekday = WEEKDAYS.indexOf(londonWeekday(locksAt));
  if (lockDay === null || weekday < 0) return null;
  const back = ((weekday - filing.weekday + 6) % 7) + 1;
  return dayBefore(lockDay, back <= filing.maxLeadDays ? back : 1);
}

/** Whether a column filing on `filing` is due at `now` for a round locking at `locksAt`. */
export function dueBeforeLock(locksAt: string, now: string, filing: Filing): boolean {
  const day = filingDay(locksAt, filing);
  return day !== null && dueFrom(day, filing.hour, locksAt, now);
}

/** Whether a column filing on London `day` from `hour` is due at `now`, until the lock at `locksAt`. */
export function dueFrom(day: string, hour: number, locksAt: string, now: string): boolean {
  const lock = instantOf(locksAt);
  const at = instantOf(now);
  const today = londonDayOf(now);
  if (lock === null || at === null || at >= lock || today === null) return false;
  return today > day || (today === day && Number(londonTime(now).slice(0, 2)) >= hour);
}

/** Whether Lawro's column is due at `now` for a round locking at `locksAt`. */
export function predictionsDue(locksAt: string, now: string): boolean {
  return dueBeforeLock(locksAt, now, PREDICTIONS.filing);
}

/** A calendar day `days` earlier, in plain date arithmetic: no clock and no zone. */
function dayBefore(day: string, days: number): string {
  const [year, month, date] = day.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, date) - days * MS_PER_DAY).toISOString().slice(0, 10);
}
