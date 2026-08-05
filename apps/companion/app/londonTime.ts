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

/** "15:00" */
export function londonTime(iso: string): string {
  return TIME.format(new Date(iso));
}

/** "Fri 18:30" — for anything far enough away that the hour alone is ambiguous. */
export function londonDayAndTime(iso: string): string {
  return DAY_AND_TIME.format(new Date(iso));
}
