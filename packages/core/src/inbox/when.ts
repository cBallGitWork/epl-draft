import { FANTRAX_TIMEZONE } from "../config";
import { londonDayAndDate, londonTime } from "../time";

// Fantrax stamps its business `"Wed Sep 2, 2026, 6:11AM"`, in US Eastern with no offset. Read as an
// instant, it prints in London like every other time.

/** Fantrax's stamp as the ISO instant it names, or null when it does not read. Their clock is
 *  US Eastern, EDT or EST by the stamp's own date, and the offset is read for that date. */
export function fantraxInstant(stamp: string): string | null {
  const wall = fantraxWall(stamp);
  if (wall === null) return null;
  // The offset at the wall reading is right but for the hours around a change; read again where it lands.
  const guess = wall - (easternWall(wall) - wall);
  return new Date(wall - (easternWall(guess) - guess)).toISOString();
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

/** Eastern's wall clock at an instant, read back as if it were UTC. */
function easternWall(at: number): number {
  const field = new Map(EASTERN.formatToParts(at).map((part) => [part.type, Number(part.value)] as const));
  const read = (type: Intl.DateTimeFormatPartTypes): number => field.get(type) ?? 0;
  return Date.UTC(read("year"), read("month") - 1, read("day"), read("hour"), read("minute"));
}

const EASTERN = new Intl.DateTimeFormat("en-US", {
  timeZone: FANTRAX_TIMEZONE,
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "numeric",
  minute: "numeric",
  hourCycle: "h23",
});
