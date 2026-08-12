// Every time this app shows is UK time, wherever the reader is. The league is
// British and its kickoffs and deadlines are announced in British time — "15:00"
// has to mean the same thing to a member watching from Toronto as to one in Leeds,
// or two people reading the same screen disagree about when the deadline is.

const TIME = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/London",
});

const DAY_AND_TIME = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/London",
});

const DATE = new Intl.DateTimeFormat("en-GB", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "Europe/London",
});

/** "Saturday 10 October" — a day, for something too far off to have a time.
 *
 *  Hands back whatever it was given when that cannot be read as a date. `Intl`
 *  throws on an invalid one, and these are formatted at module scope, so the
 *  alternative is a page that fails to import over a date it only mentions. */
export function londonDate(iso: string): string {
  const at = new Date(iso);
  return Number.isNaN(at.getTime()) ? iso : DATE.format(at);
}

/** "15:00" */
export function londonTime(iso: string): string {
  return TIME.format(new Date(iso));
}

/** "Fri 18:30" — for anything far enough away that the hour alone is ambiguous. */
export function londonDayAndTime(iso: string): string {
  return DAY_AND_TIME.format(new Date(iso));
}
