import { FANTRAX_TIMEZONE } from "../config";

// When an inbox item happened, and which KIND of "when" it is.
//
// The inbox merges two sources that date themselves differently and the merge
// was reading them as one string:
//
// · the league's business, off Fantrax, stamped `"Wed Sep 2, 2026, 6:11AM"` —
//   their own display string, in their own displayed zone, **with no offset in
//   it**. `LeagueTransaction.processedAt` keeps it verbatim for exactly that
//   reason, and turning it into an instant would mean assuming a format and a
//   timezone on data we do not control.
// · the round's deadline, ours, a real ISO instant.
//
// Sorted as text they interleave by first character, so `"2026-09-12T…"` sorts
// under `"Wed Sep 2…"` and the deadline appeared beneath ten days of older
// deals; printed through `londonDayAndDate` the Fantrax string is an invalid
// date, so the list drew their US stamp beside our `Sat 12 Sept`. One field
// carrying two vocabularies is what produced both.
//
// **So the field says which it is.** A tagged shape costs one property and buys
// a renderer that cannot get it wrong: `{ iso }` is an instant and is formatted
// in London like every other time this app prints; `{ fantrax }` is a string in
// somebody else's zone and is RE-SPELLED rather than converted, with the zone
// named on the face of it.

/** When an item happened. Two shapes, because two sources. */
export type InboxWhen =
  /** A real instant, ours. Formatted in London wherever it is read. */
  | { iso: string }
  /** Fantrax's own stamp, verbatim, offsetless. Never parsed into an instant
   *  for display — only re-spelled, and only ordered. */
  | { fantrax: string };

/** Fantrax's stamp, taken apart. Null on anything that does not read — a
 *  translated month included.
 *
 *  **A second parser of this format, and deliberately.** `orderKey` in
 *  `league/fantrax/transactions.ts` reads the same string into a synthetic
 *  sortable number for the transaction feed's own ordering; this reads it into
 *  the PARTS, for spelling them back out. Two occurrences is a coincidence
 *  (CODE_RULES §1) and the two want different things. A third asks for one
 *  parser and a shared shape. */
export function fantraxParts(stamp: string): FantraxStamp | null {
  const parts =
    /^\s*([a-z]{3})[a-z]*,?\s+([a-z]{3})[a-z]*\s+(\d{1,2}),\s*(\d{4}),\s*(\d{1,2}):(\d{2})\s*([ap])m/i.exec(
      stamp,
    );
  if (!parts) return null;

  // Defaults only satisfy the type checker: a match supplies all seven groups.
  const [, weekday = "", month = "", day = "", year = "", hour = "", minute = "", meridiem = ""] =
    parts;
  const monthIndex = MONTHS.indexOf(month.toLowerCase());
  if (monthIndex < 0) return null;

  return {
    weekday: capitalised(weekday),
    month: BRITISH_MONTHS[monthIndex] ?? capitalised(month),
    monthIndex,
    day: Number(day),
    year: Number(year),
    // 12AM is hour zero and 12PM is hour twelve; every other PM hour adds twelve.
    hours: (Number(hour) % 12) + (meridiem.toLowerCase() === "p" ? 12 : 0),
    minutes: Number(minute),
  };
}

export interface FantraxStamp {
  /** `"Wed"`, as they wrote it. */
  weekday: string;
  /** The month in the British short form the rest of the desk uses — `"Sept"`
   *  where Fantrax wrote `"Sep"`. A re-spelling, like the date order. */
  month: string;
  monthIndex: number;
  day: number;
  year: number;
  /** 0-23. Their string is 12-hour; this is the same clock said once. */
  hours: number;
  minutes: number;
}

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

/** The same twelve months as `en-GB` abbreviates them, which is what every other
 *  date on the desk is set in (`time.ts`).
 *
 *  **Only September differs, and it differs on the one column that shows both.**
 *  Fantrax writes `Sep`; British short form is `Sept`, so the inbox drew
 *  `Sat 12 Sept` for the round's deadline directly above `Wed 2 Sep` for a
 *  transaction — two spellings of one month in one blue block. Re-spelling their
 *  month is the same act as re-ordering their date and carries the same
 *  guarantee: it cannot move a transaction, because it changes no number.
 *
 *  Written out rather than formatted through `Intl`, because a formatter here
 *  would need a locale and the locale belongs to the app's own `londonTime`, not
 *  to a core mapper. If that file's locale ever moves, this is the second place
 *  to move it — which is why the disagreement is named here rather than assumed
 *  away. */
const BRITISH_MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sept",
  "Oct",
  "Nov",
  "Dec",
];

function capitalised(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

/** `"Wed 2 Sept, 6:11 AM ET"` — the same date with the clock, and the zone named.
 *
 *  **The zone is on the face of it because we did not convert it.** Fantrax
 *  publishes this in Eastern Time — their own column heading says so, in
 *  English, as "Date Processed (EDT)" — and a bare `6:11 AM` beside our London
 *  kickoffs would be read as London. Naming it is the honest alternative to
 *  either converting it or hiding it. */
export function fantraxMoment(stamp: string): string | null {
  const parts = fantraxParts(stamp);
  if (parts === null) return null;
  const hour = parts.hours % 12 === 0 ? 12 : parts.hours % 12;
  const meridiem = parts.hours < 12 ? "AM" : "PM";
  const minute = String(parts.minutes).padStart(2, "0");
  return `${parts.weekday} ${parts.day} ${parts.month}, ${hour}:${minute} ${meridiem} ET`;
}

/** `"Wed 2 Sept 6:11am"` — the date and the clock, for a cell too narrow to name
 *  the zone.
 *
 *  **The zone is dropped and the case is lowered, and both are the blue block's
 *  doing.** `fantraxMoment` spells `6:11 AM ET` because it sits under a paragraph
 *  where a bare hour beside our London kickoffs would be read as London; the
 *  index block is 64px of three-extra-small type where "ET" is a third of the
 *  line and the reader's own deadline is two rows above in London. The block's
 *  job is ordering — is this newer than that — and the read pane below it carries
 *  the full moment with the zone named for anyone comparing.
 *
 *  Still a re-spelling and never a conversion: every part comes out of their
 *  string. */
export function fantraxTime(stamp: string): string | null {
  const parts = fantraxParts(stamp);
  return parts === null ? null : `${dayOf(parts)} ${clockOf(parts)}`;
}

/** `"Wed 2 Sept"`: `fantraxTime`'s date without its clock, for a chip with room for the day alone. */
export function fantraxDay(stamp: string): string | null {
  const parts = fantraxParts(stamp);
  return parts === null ? null : dayOf(parts);
}

/** `"6:11am"`: `fantraxTime`'s clock without its date, for a block that sets the two on separate lines. */
export function fantraxClock(stamp: string): string | null {
  const parts = fantraxParts(stamp);
  return parts === null ? null : clockOf(parts);
}

function dayOf(parts: FantraxStamp): string {
  return `${parts.weekday} ${parts.day} ${parts.month}`;
}

function clockOf(parts: FantraxStamp): string {
  const hour = parts.hours % 12 === 0 ? 12 : parts.hours % 12;
  const meridiem = parts.hours < 12 ? "am" : "pm";
  return `${hour}:${String(parts.minutes).padStart(2, "0")}${meridiem}`;
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
    weekday: "",
    month,
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
