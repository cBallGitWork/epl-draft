import { FANTRAX_TIMEZONE } from "../config";
import { fantraxWall, hourOfDay, monthIndex } from "../league/fantrax/stamp";
import { MS_PER_DAY, MS_PER_MINUTE, instantOf, londonDayAndDate, londonTime, wallClockInstant } from "../time";

// Fantrax stamps its business `"Wed Sep 2, 2026, 6:11AM"`, in US Eastern with no offset, and a pending trade
// `"Oct 8, 11:53 AM BST"`, in the session's zone and named. Read as instants, they print in London like every other time.

/** Fantrax's stamp as the ISO instant it names, or null when it does not read. Their clock is
 *  US Eastern, EDT or EST by the stamp's own date, and the offset is read for that date. */
export function fantraxInstant(stamp: string): string | null {
  const wall = fantraxWall(stamp);
  return wall === null ? null : new Date(wallClockInstant(wall, FANTRAX_TIMEZONE)).toISOString();
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
  const index = monthIndex(month);
  const offset = STAMP_OFFSETS[zone.toUpperCase()];
  const at = instantOf(now);
  if (index < 0 || offset === undefined || at === null) return null;
  const inYear = (year: number) => Date.UTC(year, index, Number(day), hourOfDay(hour, meridiem), Number(minute)) - offset * MS_PER_MINUTE;
  const year = new Date(at).getUTCFullYear();
  // A proposal is never in the future: a stamp past `now`, a day's slack for the zones, is last year's.
  const thisYear = inYear(year);
  return new Date(thisYear <= at + MS_PER_DAY ? thisYear : inYear(year - 1)).toISOString();
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
