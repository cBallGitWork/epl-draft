import { LEAGUE_TIMEZONE } from "./config";

// Instants and the league's calendar: every date the app, the paper and the scripts print or file
// by is read here, in London, whatever the reader's own zone.

/** An ISO instant as milliseconds, or null when it cannot be read.
 *
 *  **Six sites were writing this guard by hand**, each slightly differently, and
 *  the difference mattered: one treated an unreadable instant as inside the
 *  window and another as outside. Provider data is untrusted (CODE_RULES §5),
 *  so "cannot be read" is an answer the caller has to see rather than a NaN
 *  that silently compares false against everything. */
export function instantOf(iso: string): number | null {
  const at = Date.parse(iso);
  return Number.isNaN(at) ? null : at;
}

/** An ISO instant as the league's own day, or null when it cannot be read. */
export function londonDayOf(iso: string): string | null {
  const at = instantOf(iso);
  return at === null ? null : londonDay(new Date(at));
}

/** A date as the league's own day, `YYYY-MM-DD`. `en-CA` because it is the
 *  sortable spelling; nothing formatted by it reaches a screen.
 *
 *  One formatter for three callers — the front page's running order, the Team
 *  Sheet's day key and the capture paths each built their own, and one of them
 *  rebuilt it on every call. A day key that disagreed between them would file a
 *  23:30 conference under the wrong date. */
export function londonDay(at: Date): string {
  return DAY_KEY.format(at);
}

const DAY_KEY = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  timeZone: LEAGUE_TIMEZONE,
});

const TIME = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: LEAGUE_TIMEZONE,
});

const DAY_AND_TIME = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: LEAGUE_TIMEZONE,
});

const WEEKDAY = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  timeZone: LEAGUE_TIMEZONE,
});

const WEEKDAY_LONG = new Intl.DateTimeFormat("en-GB", { weekday: "long", timeZone: LEAGUE_TIMEZONE });

const DAY_AND_DATE = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
  timeZone: LEAGUE_TIMEZONE,
});

const DATE = new Intl.DateTimeFormat("en-GB", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: LEAGUE_TIMEZONE,
});

/** A provider's ISO string in London, or the string itself when it is not a date: these run in
 *  render, and `Intl.format` throws on an invalid date. */
function readable(iso: string, format: Intl.DateTimeFormat): string {
  const at = new Date(iso);
  return Number.isNaN(at.getTime()) ? iso : format.format(at);
}

/** `Saturday 10 October`. */
export function londonDate(iso: string): string {
  return readable(iso, DATE);
}

/** `Sat 10 Oct`. */
export function londonDayAndDate(iso: string): string {
  return readable(iso, DAY_AND_DATE);
}

/** `15:00`. */
export function londonTime(iso: string): string {
  return readable(iso, TIME);
}

/** `Sat 15:00`. */
export function londonDayAndTime(iso: string): string {
  return readable(iso, DAY_AND_TIME);
}

/** `Sat`. */
export function londonWeekday(iso: string): string {
  return readable(iso, WEEKDAY);
}

/** `Saturday`. */
export function londonWeekdayLong(iso: string): string {
  return readable(iso, WEEKDAY_LONG);
}

/** `Sat` for a London day, `2026-10-10`: noon UTC falls on that date in London in summer and in winter. */
export function weekdayOfDay(day: string): string {
  return londonWeekday(`${day}T12:00:00Z`);
}

/** `Saturday` for a London day, `2026-10-10`. */
export function weekdayLongOfDay(day: string): string {
  return londonWeekdayLong(`${day}T12:00:00Z`);
}
