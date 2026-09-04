// Championship Manager's caption line: `Born 2.10.79 (Age 19). English.`
//
// Ours stops after the age, and that is a sourcing decision rather than a
// design one. The date and the age come from FPL's `birth_date`, which we hold
// and type. The nationality does not: FPL publishes `region` as an opaque
// integer over 67 values with no lookup table anywhere, and Fantrax gives a
// birthplace only as a label inside a list of English strings — reading it back
// out by matching the word "Birthplace" would bind this line to their wording.
// It stays in the facts block below the grid, rendered as what it is, and the
// caption says the part we can state ourselves.
//
// CM's own date format, kept: `2.10.79` is day, month, two-digit year with no
// padding. It is the one piece of 1999 typography on this screen that is
// genuinely information rather than dress.

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
  /** Where he is from, as Fantrax writes it — `"Maia, Portugal"`. The COUNTRY is
   *  taken off the end of it and the town dropped, because CM's line is a
   *  nationality: `cm9900/11.jpg` reads `Born 2.10.79 (Age 19). English.` and
   *  the Özil profile `Born 15.10.79 (Age 21). German (17 caps/2 goals).`
   *
   *  A country and a nationality are not the same word — CM writes "English"
   *  where this writes "England" — and inventing the adjective would need a
   *  table of demonyms nobody has checked. The country is the fact we hold. */
  birthplace: string | null = null,
): string | null {
  const born = parseIsoDate(birthDate);
  const from = country(birthplace);
  if (born === null) return from === null ? null : `${from}.`;
  const age = ageOn(born, now);
  const stamp = `${born.day}.${born.month}.${String(born.year % 100).padStart(2, "0")}`;
  const line = age === null ? `Born ${stamp}.` : `Born ${stamp} (Age ${age}).`;
  return from === null ? line : `${line} ${from}.`;
}

/** The country out of a birthplace. Null for an empty string or one Fantrax
 *  padded with nothing, which it does — `profile.ts` records the empty rows. */
function country(birthplace: string | null): string | null {
  const parts = (birthplace ?? "").split(",").map((part) => part.trim()).filter(Boolean);
  return parts.length === 0 ? null : parts[parts.length - 1];
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
  let age = now.getFullYear() - born.year;
  const beforeBirthday =
    now.getMonth() + 1 < born.month ||
    (now.getMonth() + 1 === born.month && now.getDate() < born.day);
  if (beforeBirthday) age -= 1;
  return age < 0 ? null : age;
}
