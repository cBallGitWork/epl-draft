// Fantrax's stamps, "Wed Sep 2, 2026, 6:11AM" on the transaction log and "Oct 8, 11:53 AM BST" on a pending trade: one
// reader for their month names and their twelve-hour clock. `inbox/when.ts` places them in time.

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

/** A month's index from its first three letters, any case; -1 for one Fantrax does not print, a translated one too. */
export function monthIndex(month: string): number {
  return MONTHS.indexOf(month.toLowerCase());
}

/** A twelve-hour clock's hour as the day's: 12AM is hour nought and 12PM hour twelve. */
export function hourOfDay(hour: string, meridiem: string): number {
  return (Number(hour) % 12) + (meridiem.toLowerCase() === "p" ? 12 : 0);
}

/** The log's stamp as its wall clock read as if it were UTC, which also orders the log; null on anything that does not
 *  read. Their clock is US Eastern with no offset in it: `fantraxInstant` places it. */
export function fantraxWall(stamp: string | null): number | null {
  const parts = /^\s*[a-z]{3}[a-z]*,?\s+([a-z]{3})[a-z]*\s+(\d{1,2}),\s*(\d{4}),\s*(\d{1,2}):(\d{2})\s*([ap])m/i.exec(stamp ?? "");
  if (!parts) return null;
  // Defaults only satisfy the type checker: a match supplies all six groups.
  const [, month = "", day = "", year = "", hour = "", minute = "", meridiem = ""] = parts;
  const index = monthIndex(month);
  return index < 0 ? null : Date.UTC(Number(year), index, Number(day), hourOfDay(hour, meridiem), Number(minute));
}
