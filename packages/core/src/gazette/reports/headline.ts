import { banned } from "../banned";
import { REPORT_FPL } from "./words";
import { REPORT_NEVER } from "./style";

// The day's headline: the writer offers several, the desk strikes those that break a rule, and the fan picks one or none
// (sports desk, 28 Sep 2026). A pun that needs the report to explain it, or is untrue, is worse than a plain line.

const WORDS = 8;
const TABLOID = /\b(?:sinks?|stuns?|rocks?|hammers?|thrash(?:es)?|crush(?:es)?|smash(?:es)?|stun|blitz(?:es)?|romp(?:s)?|sweep(?:s)? aside)\b/iu;

/** Why a candidate is struck, or null when it may go to the fan. `names` are the proper nouns the facts carry. */
export function strike(headline: string, names: readonly string[]): string | null {
  if (headline.trim() === "") return "empty";
  if (headline.split(/\s+/u).length > WORDS) return "over eight words";
  if (/,|;|:/u.test(headline)) return "two clauses";
  if (/\bas\b/iu.test(headline)) return "an 'as' clause";
  if (TABLOID.test(headline)) return "a tabloid verb";
  if (banned(headline, [...REPORT_NEVER, ...REPORT_FPL]).length > 0) return "a banned phrase";
  const proper = (headline.match(/(?<!^)\b\p{Lu}[\p{L}'’-]+/gu) ?? [])
    .map((word) => word.replace(/['’]s$/u, ""))
    .filter((word) => !names.some((name) => name.includes(word)));
  if (proper.length > 0) return `a name the facts do not carry: ${proper[0]}`;
  return null;
}

/** The candidates that survive the desk, in the writer's order. */
export function survivors(candidates: readonly string[], names: readonly string[]): string[] {
  return candidates.filter((c) => strike(c, names) === null);
}
