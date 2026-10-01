// The words a report may use for a moment's minute, worked out here so the model does no arithmetic on a clock.
// House numerals: one to nine in words, 10 and up in figures.

import { HALF_MINUTES } from "../../config";
import { ordinal } from "../../league/ordinal";
import { plural } from "../../format";

/** Normal time, both halves. */
const NORMAL_TIME = 2 * HALF_MINUTES;

const WORDS = ["nought", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];

/** A count as the paper prints it. */
export function numeral(n: number): string {
  return n >= 0 && n < 10 ? WORDS[n] : String(n);
}

const counted = (n: number, word: string) => `${numeral(n)} ${plural(n, word)}`;

export { ordinal };

/** `"45+4"` → 45 and 4; `"67"` → 67 and 0. Null for a label with no clock. */
export function clock(label: string): { minute: number; added: number } | null {
  const found = /^(\d+)(?:\+(\d+))?/.exec(label);
  if (found === null) return null;
  return { minute: Number(found[1]), added: found[2] === undefined ? 0 : Number(found[2]) };
}

/** Every phrase the writer may use for this minute, the plainest first. A change at 46 is a half-time change. */
export function minutePhrases(label: string, change = false): string[] {
  const at = clock(label);
  if (at === null) return [];
  const { minute, added } = at;
  if (added > 0) {
    const half = minute <= HALF_MINUTES ? "first-half " : "";
    const phrases = [
      `${counted(added, "minute")} into ${half}added time`,
      `${counted(added, "minute")} into ${half}stoppage time`,
      `in ${half}added time`,
      `in ${half}stoppage time`,
    ];
    if (minute <= HALF_MINUTES) phrases.push("just before half-time", "just before the interval");
    else if (added >= 4) phrases.push("deep into added time", "deep into stoppage time");
    return phrases;
  }
  if (minute === 46 && change) return ["at half-time", "at the interval"];
  const phrases = [`in the ${ordinal(minute)} minute`];
  if (minute > 1) phrases.push(`after ${minute} minutes`);
  if (minute === HALF_MINUTES) phrases.push("on half-time");
  if (minute >= 40 && minute < HALF_MINUTES) phrases.push("just before half-time");
  if (minute >= 46 && minute <= 50) phrases.push("just after half-time", "early in the second half");
  if (minute === 60) phrases.push("on the hour");
  if (minute >= 62 && minute <= 72) phrases.push("midway through the second half");
  if (minute >= 70 && minute < NORMAL_TIME) phrases.push(`${counted(NORMAL_TIME - minute, "minute")} from time`, `with ${counted(NORMAL_TIME - minute, "minute")} left`);
  return phrases;
}

/** Minutes left in normal time at this moment; null in added time or the first half. */
export function minutesLeft(label: string): number | null {
  const at = clock(label);
  if (at === null || at.added > 0 || at.minute <= HALF_MINUTES) return null;
  return NORMAL_TIME - at.minute;
}
