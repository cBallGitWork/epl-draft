import { FANTRAX_TIMEZONE } from "../config";
import { MS_PER_DAY, MS_PER_MINUTE, londonDayAndDate, londonTime } from "../time";

// Fantrax stamps its business `"Wed Sep 2, 2026, 6:11AM"`, in US Eastern with no offset, and a pending trade
// `"Oct 8, 11:53 AM BST"`, in the session's zone and named. Read as instants, they print in London like every other time.

/** Fantrax's stamp as the ISO instant it names, or null when it does not read. Their clock is
 *  US Eastern, EDT or EST by the stamp's own date, and the offset is read for that date. */
export function fantraxInstant(stamp: string): string | null {
  const wall = fantraxWall(stamp);
  return wall === null ? null : new Date(instantOfWall(wall, FANTRAX_TIMEZONE)).toISOString();
}

/** The zones Fantrax names after a stamp (they follow the account that read it), as minutes ahead of UTC: the name
 *  fixes the offset, so a wall time the clocks repeat is still one instant. */
const STAMP_OFFSETS: Readonly<Record<string, number>> = { EDT: -240, EST: -300, BST: 60, GMT: 0 };

/** The pending page's stamp, `"Oct 8, 11:53 AM BST"`, as the ISO instant it names: it prints the zone and not the year,
 *  so it is the latest such day not after `now`. Null when it does not read or names a zone `STAMP_OFFSETS` lacks. */
export function proposedInstant(stamp: string, now: string): string | null {
  const parts = /^\s*([a-z]{3})[a-z]*\s+(\d{1,2}),\s*(\d{1,2}):(\d{2})\s*([ap])m\s+([a-z]{2,5})\s*$/i.exec(stamp);
  if (!parts) return null;
  const [, month = "", day = "", hour = "", minute = "", meridiem = "", zone = ""] = parts;
  const monthIndex = MONTHS.indexOf(month.toLowerCase());
  const offset = STAMP_OFFSETS[zone.toUpperCase()];
  const at = Date.parse(now);
  if (monthIndex < 0 || offset === undefined || Number.isNaN(at)) return null;
  const hours = (Number(hour) % 12) + (meridiem.toLowerCase() === "p" ? 12 : 0);
  const inYear = (year: number) => Date.UTC(year, monthIndex, Number(day), hours, Number(minute)) - offset * MS_PER_MINUTE;
  const year = new Date(at).getUTCFullYear();
  // A proposal is never in the future: a stamp past `now`, a day's slack for the zones, is last year's.
  const thisYear = inYear(year);
  return new Date(thisYear <= at + MS_PER_DAY ? thisYear : inYear(year - 1)).toISOString();
}

/** A wall clock in a zone as the instant it names. The offset at the wall reading is right but for the hours around a
 *  change, so it is read again where it lands. */
function instantOfWall(wall: number, timeZone: string): number {
  const guess = wall - (wallIn(timeZone, wall) - wall);
  return wall - (wallIn(timeZone, guess) - guess);
}

/** `"Wed 2 Sept 11:11"`: Fantrax's stamp in London time. */
export function fantraxTime(stamp: string): string | null {
  const at = fantraxInstant(stamp);
  return at === null ? null : `${londonDayAndDate(at)} ${londonTime(at)}`;
}

/** `"Wed 2 Sept"`: the London day a Fantrax stamp falls on. */
export function fantraxDay(stamp: string): string | null {
  const at = fantraxInstant(stamp);
  return at === null ? null : londonDayAndDate(at);
}

/** Their wall clock as if it were UTC; null on anything that does not read, a translated month included. */
function fantraxWall(stamp: string): number | null {
  const parts =
    /^\s*[a-z]{3}[a-z]*,?\s+([a-z]{3})[a-z]*\s+(\d{1,2}),\s*(\d{4}),\s*(\d{1,2}):(\d{2})\s*([ap])m/i.exec(
      stamp,
    );
  if (!parts) return null;

  // Defaults only satisfy the type checker: a match supplies all six groups.
  const [, month = "", day = "", year = "", hour = "", minute = "", meridiem = ""] = parts;
  const monthIndex = MONTHS.indexOf(month.toLowerCase());
  if (monthIndex < 0) return null;
  // 12AM is hour zero and 12PM is hour twelve; every other PM hour adds twelve.
  const hours = (Number(hour) % 12) + (meridiem.toLowerCase() === "p" ? 12 : 0);
  return Date.UTC(Number(year), monthIndex, Number(day), hours, Number(minute));
}

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

/** One formatter per zone: a whole inbox of stamps reads through the same one or two. */
const FORMATS = new Map<string, Intl.DateTimeFormat>();

/** A zone's wall clock at an instant, read back as if it were UTC. */
function wallIn(timeZone: string, at: number): number {
  let format = FORMATS.get(timeZone);
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
    FORMATS.set(timeZone, format);
  }
  const field = new Map(format.formatToParts(at).map((part) => [part.type, Number(part.value)] as const));
  const read = (type: Intl.DateTimeFormatPartTypes): number => field.get(type) ?? 0;
  return Date.UTC(read("year"), read("month") - 1, read("day"), read("hour"), read("minute"));
}
