import { LEAGUE_TIMEZONE } from "@epl/core";

// Every time this app shows is UK time, wherever the reader is. The league is
// British and its kickoffs and deadlines are announced in British time — "15:00"
// has to mean the same thing to a member watching from Toronto as to one in Leeds,
// or two people reading the same screen disagree about when the deadline is.

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

const DATE = new Intl.DateTimeFormat("en-GB", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: LEAGUE_TIMEZONE,
});

/** Format an instant, or hand back the string when it cannot be read as one.
 *
 *  **`Intl.format` throws on an invalid date**, and every caller here is passing
 *  a string from a provider we do not control, during a render. So a malformed
 *  timestamp is not a wrong time on the screen, it is a page that does not
 *  render at all over a date it mentions in passing.
 *
 *  `londonDate` carried this guard and its three siblings did not, on no stated
 *  reason — they take the same untrusted string from the same feeds. Written
 *  once here so the four cannot disagree again; the first test ever written
 *  under `apps/` is what found them disagreeing. */
function readable(iso: string, format: Intl.DateTimeFormat): string {
  const at = new Date(iso);
  return Number.isNaN(at.getTime()) ? iso : format.format(at);
}

/** "Saturday 10 October" — a day, for something too far off to have a time. */
export function londonDate(iso: string): string {
  return readable(iso, DATE);
}

/** "15:00" */
export function londonTime(iso: string): string {
  return readable(iso, TIME);
}

/** "Fri 18:30" — for anything far enough away that the hour alone is ambiguous. */
export function londonDayAndTime(iso: string): string {
  return readable(iso, DAY_AND_TIME);
}

/** "Sun" — the day on its own, for a list whose times are already in a column of
 *  their own.
 *
 *  A round runs Friday to Monday, so an hour without a day reads as scrambled:
 *  the matchday list is sorted by instant and prints 17:30 above 14:00 because
 *  one is Saturday and the other Sunday. Where there is room for a sentence,
 *  `londonDayAndTime` is the answer; where the time is a fixed compact slot with
 *  a score's worth of width, the day goes beside it instead of inside it. */
export function londonDay(iso: string): string {
  return readable(iso, WEEKDAY);
}
