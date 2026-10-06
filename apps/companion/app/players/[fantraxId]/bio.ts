import { londonDay } from "@epl/core";

// Championship Manager's caption line: `Born 2.10.79 (Age 19). English.`, in CM's unpadded d.m.yy.

/** `Born 5.3.93 (Age 33). England.`, his country alone without a date, or null with neither. */
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

/** `1995-09-15` and nothing else, parsed by hand: `new Date` reads it as UTC midnight and shifts it west of Greenwich. */
function parseIsoDate(value: string | null): BornOn | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value ?? "");
  if (match === null) return null;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return { year, month, day };
}

/** Whole years, counting the birthday as the day he turns; null for a date in the future. */
function ageOn(born: BornOn, now: Date): number | null {
  // London's date, not the server's: Vercel's clock reads UTC, an hour behind all summer.
  const [year = 0, month = 0, day = 0] = londonDay(now).split("-").map(Number);
  let age = year - born.year;
  const beforeBirthday = month < born.month || (month === born.month && day < born.day);
  if (beforeBirthday) age -= 1;
  return age < 0 ? null : age;
}
