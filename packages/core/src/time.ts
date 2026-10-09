import { LEAGUE_TIMEZONE } from "./config";

/** A calendar day in milliseconds, for spans between UTC instants. */
export const MS_PER_DAY = 86_400_000;

/** A minute in milliseconds. */
export const MS_PER_MINUTE = 60_000;

// Instants and the league's calendar: every date the app, the paper and the scripts print or file
// by is read here, in London, whatever the reader's own zone.

/** An ISO instant as milliseconds, or null when it cannot be read, never a NaN that compares false with everything. */
export function instantOf(iso: string): number | null {
  const at = Date.parse(iso);
  return Number.isNaN(at) ? null : at;
}

/** An ISO instant as the league's own day, or null when it cannot be read. */
export function londonDayOf(iso: string | null | undefined): string | null {
  const at = instantOf(iso ?? "");
  return at === null ? null : londonDay(new Date(at));
}

/** Whether an instant falls on this league day; a missing or unreadable one is on no day. */
export function onLondonDay(iso: string | null | undefined, day: string): boolean {
  return londonDayOf(iso ?? "") === day;
}

/** A date as the league's own day, `YYYY-MM-DD`: `en-CA` for the sortable spelling, never printed. */
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
  const at = instantOf(iso);
  return at === null ? iso : format.format(at);
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

/** `Sat 10 Oct, 15:00`: an instant to the minute, as a letter or a "last updated" line dates it. */
export function londonMoment(iso: string): string {
  return `${londonDayAndDate(iso)}, ${londonTime(iso)}`;
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

/** A wall clock in a zone, given as if it were UTC (ms), as the instant it names. The offset at the wall reading is
 *  right but for the hours around a change, so it is read again where it lands. */
export function wallClockInstant(wall: number, timeZone: string): number {
  const guess = wall - (wallIn(timeZone, wall) - wall);
  return wall - (wallIn(timeZone, guess) - guess);
}

/** One formatter per zone: a whole inbox of stamps reads through the same one or two. */
const WALL_FORMATS = new Map<string, Intl.DateTimeFormat>();

/** A zone's wall clock at an instant, read back as if it were UTC. */
function wallIn(timeZone: string, at: number): number {
  let format = WALL_FORMATS.get(timeZone);
  if (format === undefined) {
    format = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      hourCycle: "h23",
    });
    WALL_FORMATS.set(timeZone, format);
  }
  const field = new Map(format.formatToParts(at).map((part) => [part.type, Number(part.value)] as const));
  const read = (type: Intl.DateTimeFormatPartTypes): number => field.get(type) ?? 0;
  return Date.UTC(read("year"), read("month") - 1, read("day"), read("hour"), read("minute"));
}
