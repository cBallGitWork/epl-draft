import { londonDay } from "@epl/core";

// Championship Manager's caption line: `Born 2.10.79 (Age 19). English.`, in CM's unpadded d.m.yy.

/** `Born 5.3.93 (Age 33).`, or null when FPL has not filled his date in.
 *
 *  Null for 19 of 652 (probed 4 Sep 2026), and the caller draws the view's own
 *  name in the caption instead — a box that says "Profile" is a worse line than
 *  a birth date and a better one than "Born —".
 *
 *  `now` is injected because this is a pure function and the age is the only
 *  thing on the screen that changes without the data changing. */
export function bornLine(
  birthDate: string | null,
  now: Date,
  /** The country FPL files him under (`countryOf`), not where he was born. */
  country: string | null = null,
): string | null {
  const born = parseIsoDate(birthDate);
  const from = country?.trim() || null;
  if (born === null) return from === null ? null : `${from}.`;
  const age = ageOn(born, now);
  const stamp = `${born.day}.${born.month}.${String(born.year % 100).padStart(2, "0")}`;
  const line = age === null ? `Born ${stamp}.` : `Born ${stamp} (Age ${age}).`;
  return from === null ? line : `${line} ${from}.`;
}

interface BornOn {
  year: number;
  month: number;
  day: number;
}

/** `1995-09-15` and nothing else.
 *
 *  Parsed rather than handed to `new Date`, which reads a bare ISO date as
 *  midnight UTC and would put a man born on the first of a month into the
 *  previous one for any reader west of Greenwich. A birthday is a calendar fact
 *  and has no timezone. */
function parseIsoDate(value: string | null): BornOn | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value ?? "");
  if (match === null) return null;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return { year, month, day };
}

/** Whole years, counting the birthday as the day he turns.
 *
 *  Null for a date in the future rather than a negative age: FPL has published
 *  worse, and a `(Age -1)` on screen is the confident wrong number this app
 *  spends its comments avoiding. */
function ageOn(born: BornOn, now: Date): number | null {
  // London's date, not the server's: Vercel's clock reads UTC, an hour behind all summer.
  const [year = 0, month = 0, day = 0] = londonDay(now).split("-").map(Number);
  let age = year - born.year;
  const beforeBirthday = month < born.month || (month === born.month && day < born.day);
  if (beforeBirthday) age -= 1;
  return age < 0 ? null : age;
}
