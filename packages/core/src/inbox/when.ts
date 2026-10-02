import { FANTRAX_TIMEZONE } from "../config";
import { londonDayAndDate, londonTime } from "../time";

// When an inbox item happened. Fantrax stamps its business `"Wed Sep 2, 2026, 6:11AM"`, in US Eastern
// with no offset; the deadline is ours, an ISO instant. Both are printed in London.

/** When an item happened. Two shapes, because two sources. */
export type InboxWhen =
  /** A real instant, ours. */
  | { iso: string }
  /** Fantrax's own stamp, verbatim; `fantraxInstant` reads it. */
  | { fantrax: string };

/** Fantrax's stamp, taken apart. Null on anything that does not read, a translated month included. */
function fantraxParts(stamp: string): FantraxStamp | null {
  const parts =
    /^\s*[a-z]{3}[a-z]*,?\s+([a-z]{3})[a-z]*\s+(\d{1,2}),\s*(\d{4}),\s*(\d{1,2}):(\d{2})\s*([ap])m/i.exec(
      stamp,
    );
  if (!parts) return null;

  // Defaults only satisfy the type checker: a match supplies all six groups.
  const [, month = "", day = "", year = "", hour = "", minute = "", meridiem = ""] = parts;
  const monthIndex = MONTHS.indexOf(month.toLowerCase());
  if (monthIndex < 0) return null;

  return {
    monthIndex,
    day: Number(day),
    year: Number(year),
    // 12AM is hour zero and 12PM is hour twelve; every other PM hour adds twelve.
    hours: (Number(hour) % 12) + (meridiem.toLowerCase() === "p" ? 12 : 0),
    minutes: Number(minute),
  };
}

interface FantraxStamp {
  monthIndex: number;
  day: number;
  year: number;
  /** 0-23. */
  hours: number;
  minutes: number;
}

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

/** Fantrax's stamp as the ISO instant it names, or null when it does not read. Their clock is
 *  US Eastern, EDT or EST by the stamp's own date, and the offset is read for that date. */
export function fantraxInstant(stamp: string): string | null {
  const parts = fantraxParts(stamp);
  if (parts === null) return null;
  const wall = Date.UTC(parts.year, parts.monthIndex, parts.day, parts.hours, parts.minutes);
  // The offset at the wall reading is right but for the hours around a change; read again where it lands.
  const guess = wall - (easternWall(wall) - wall);
  return new Date(wall - (easternWall(guess) - guess)).toISOString();
}

/** Eastern's wall clock at an instant, read back as if it were UTC. */
function easternWall(at: number): number {
  const parts = easternParts(new Date(at).toISOString());
  return parts === null
    ? at
    : Date.UTC(parts.year, parts.monthIndex, parts.day, parts.hours, parts.minutes);
}

/** `"Wed 2 Sept 11:11"`: Fantrax's stamp in London time. */
export function fantraxTime(stamp: string): string | null {
  const day = fantraxDay(stamp);
  return day === null ? null : `${day} ${fantraxClock(stamp)}`;
}

/** `"Wed 2 Sept"`: the London day a Fantrax stamp falls on. */
export function fantraxDay(stamp: string): string | null {
  const at = fantraxInstant(stamp);
  return at === null ? null : londonDayAndDate(at);
}

/** `"11:11"`: a Fantrax stamp's London clock. */
export function fantraxClock(stamp: string): string | null {
  const at = fantraxInstant(stamp);
  return at === null ? null : londonTime(at);
}

/** One comparable number for both shapes, and nothing but ordering ever sees it.
 *
 *  **Both are read as a calendar in Fantrax's own zone**, which is what makes
 *  them comparable without converting either: their stamp is already in that
 *  calendar, and an ISO instant is put into it by `Intl` rather than by
 *  arithmetic, so daylight saving is the platform's problem and not ours.
 *
 *  It is a synthetic ordinal — months of 32 days, so no month can overflow into
 *  the next — and not an instant. Nothing may print it, store it, or subtract
 *  two of them.
 *
 *  Null for an item with no date at all, and for a stamp that does not read. */
export function whenKey(at: InboxWhen | null): number | null {
  if (at === null) return null;
  const parts = "fantrax" in at ? fantraxParts(at.fantrax) : easternParts(at.iso);
  if (parts === null) return null;
  const days = (parts.year * 12 + parts.monthIndex) * 32 + parts.day;
  return (days * 24 + parts.hours) * 60 + parts.minutes;
}

/** An ISO instant's calendar fields in Fantrax's zone, or null if it will not
 *  parse. `Intl` is deterministic given the instant, so this reads no clock. */
function easternParts(iso: string): FantraxStamp | null {
  const at = new Date(iso);
  if (Number.isNaN(at.getTime())) return null;
  const fields = new Map(
    EASTERN.formatToParts(at).map((part) => [part.type, part.value] as const),
  );
  const month = fields.get("month") ?? "";
  const monthIndex = MONTHS.indexOf(month.toLowerCase());
  if (monthIndex < 0) return null;
  return {
    monthIndex,
    day: Number(fields.get("day")),
    year: Number(fields.get("year")),
    hours: Number(fields.get("hour")),
    minutes: Number(fields.get("minute")),
  };
}

const EASTERN = new Intl.DateTimeFormat("en-US", {
  timeZone: FANTRAX_TIMEZONE,
  year: "numeric",
  month: "short",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});
