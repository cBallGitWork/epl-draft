import { escapeRegExp } from "../regExp";
import { REPORT_AMERICAN } from "./reports/words";
import { AMERICAN_IZE, SHEETS_AMERICAN } from "./sheets/words";

// The phrases the paper does not print, and the check that finds them: the prompt's list is generated from these.

/** Register: Craig's own list of American sports-desk voice, and "bank". */
export const REGISTER: readonly string[] = [
  "banked", "banks", "bank", "banking",
  "cashed in", "chipped in", "chips in",
  "ran the board", "moved the needle", "move the needle",
  "came up big", "difference maker", "difference-maker",
  "on the day", "at the end of the day", "when all was said and done",
];

/** Sequence: claims about a match the desk cannot see. Lifted for the match report, which is handed the sequence. */
const SEQUENCE: readonly string[] = [
  "off the bench", "came on", "brought on", "withdrawn", "substituted",
  "opened the scoring", "levelled it", "put them ahead",
];

/** Grounds: recalled, never read, since the desk is given no venue. */
export const GROUNDS: readonly string[] = [
  "Anfield", "Elland Road", "Stamford Bridge", "the Bridge", "Stadium of Light",
  "Old Trafford", "the Emirates", "the Etihad", "Villa Park", "Goodison",
  "St James", "Selhurst Park", "Craven Cottage", "Molineux", "the Amex",
  "Bramall Lane", "Kenilworth Road", "Portman Road", "the London Stadium",
  "King Power", "Turf Moor", "the Gtech", "Hill Dickinson",
];

/** Filler: sentences that say nothing. "knock" is banned outright. */
export const FILLER: readonly string[] = [
  "knock", "knocks",
  "heaviest load", "reads heaviest", "the picture is harder", "a mixed bag",
  "the better news", "the day's better news", "elsewhere the picture",
  "the shape of the day", "long absence lists",
  "all told", "make no mistake", "it remains to be seen", "needless to say",
  "the fact remains", "one thing is certain",
];

export const BANNED: readonly string[] = [...REGISTER, ...SEQUENCE, ...GROUNDS, ...FILLER];

/** How often the prose uses a phrase, whole words only, so "bank" never counts "Bankole". */
function timesUsed(prose: string, phrase: string): number {
  return (prose.match(new RegExp(`(?<![\\p{L}])${escapeRegExp(phrase)}(?![\\p{L}])`, "giu")) ?? []).length;
}

/** Every listed phrase the prose uses, once each in list order. */
export function banned(prose: string, list: readonly string[] = BANNED): string[] {
  return list.filter((phrase) => timesUsed(prose, phrase) > 0);
}

/** Each capped phrase the prose uses more often than its cap, as "phrase ×times". */
export function overused(prose: string, caps: readonly (readonly [phrase: string, most: number])[]): string[] {
  return caps.flatMap(([phrase, most]) => {
    const used = timesUsed(prose, phrase);
    return used > most ? [`${phrase} ×${used}`] : [];
  });
}

/** A quotation mark, where the paper prints nobody's words. */
export const QUOTE_MARKS = /["“”«»]/u;

/** Not British English: the team sheets' American words, then the match report's. */
export const AMERICAN: readonly string[] = [...SHEETS_AMERICAN, ...REPORT_AMERICAN];

/** The words on `list` the prose uses, then its first American -ize spelling. */
export function americanisms(prose: string, list: readonly string[] = AMERICAN): string[] {
  const ize = prose.match(AMERICAN_IZE)?.[0];
  return ize === undefined ? banned(prose, list) : [...banned(prose, list), ize];
}
