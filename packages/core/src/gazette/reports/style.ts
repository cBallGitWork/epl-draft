import { REPORTS } from "../../config";
import { FILLER, GROUNDS, QUOTE_MARKS, REGISTER, americanisms, banned, overused } from "../banned";
import type { Report } from "../predictions/checks";
import { masked, ngrams, sentences, wordCount } from "../predictions/prose";
import { DESK_BANNED } from "../predictions/words";
import {
  REPORT_ADVICE, REPORT_CAPPED_DAY, REPORT_CAPPED_MATCH, REPORT_CLICHES, REPORT_CROWD, REPORT_DEPTH_CHART,
  REPORT_FANTASY, REPORT_FPL, REPORT_GROUNDS, REPORT_NOT_HIS_NAME, REPORT_SHOTS, REPORT_TELLS, REPORT_VERDICTS,
} from "./words";

// The words a match report may not use, checked after filing; the voice is built from the same arrays.

/** Echoes quoted back per match: past three, a rewrite is told the pattern, not drowned in it. */
const ECHOES_QUOTED = 3;

/** Everything sent back wherever it appears. SEQUENCE is lifted: this desk is handed the order of the match. No ground is. */
export const REPORT_NEVER: readonly string[] = [
  ...REGISTER, ...FILLER, ...GROUNDS, ...REPORT_GROUNDS, ...DESK_BANNED, ...REPORT_CLICHES, ...REPORT_SHOTS, ...REPORT_VERDICTS, ...REPORT_CROWD,
  ...REPORT_TELLS, ...REPORT_DEPTH_CHART,
];

const SOURCE = /%|\bper ?cent\b|\b(?:projected|projections?|predicted|predictions?|model|Fantrax|according to)\b/iu;
const CLOCK = /\b\d{1,3}(?:\+\d{1,2})?['’](?!s\b)|\b\d{2}\+\d{1,2}\b/u;
const NOT_BUT = /\bnot (?:just |only |merely )?[^.;]{1,40}?,? but\b/iu;
const FORECAST = /\b(?:will|should|is (?:likely|expected|set) to|could|may|might) (?:start|keep his place|be picked|come (?:back )?in|return to the side|get the nod)\b|\bnext (?:week|time out|gameweek)\b/iu;

/** One piece of prose, marked by the part of the piece it is: football parts carry no draft words. */
export function wordFaults(section: string, text: string, football: boolean, names: readonly string[], fault: Report): void {
  const plain = masked(text, names).replace(/\u0000/gu, "X");
  if (QUOTE_MARKS.test(text)) fault(section, "quotation marks: no quotes were given", "hard", text.match(QUOTE_MARKS)?.[0] ?? "");
  if (SOURCE.test(plain)) fault(section, "names a source or a percentage", "hard", plain.match(SOURCE)?.[0] ?? "");
  for (const word of banned(plain, REPORT_FPL)) fault(section, "a fantasy game's term", "hard", word);
  for (const word of banned(plain, REPORT_NEVER)) fault(section, "a phrase this paper does not print", "send-back", word);
  for (const word of americanisms(plain)) fault(section, "American, not British", "send-back", word);
  for (const word of banned(plain, REPORT_ADVICE)) fault(section, "advice; set the facts side by side instead", "send-back", word);
  if (football) for (const word of banned(plain, REPORT_FANTASY)) fault(section, "a draft word in the football", "send-back", word);
  if (REPORT_NOT_HIS_NAME.test(text)) fault(section, "a man called anything but his name", "send-back", text.match(REPORT_NOT_HIS_NAME)?.[0] ?? "");
  if (CLOCK.test(text)) fault(section, "a minute as a clock; use the phrases given", "send-back", text.match(CLOCK)?.[0] ?? "");
  if (text.includes("?")) fault(section, "a question", "send-back", "?");
  if (text.includes(":")) fault(section, "a colon in prose", "send-back", ":");
  if (NOT_BUT.test(text)) fault(section, "not this but that", "send-back", text.match(NOT_BUT)?.[0] ?? "");
  if (FORECAST.test(text)) fault(section, "a forecast of selection", "send-back", text.match(FORECAST)?.[0] ?? "");
  const longest = REPORTS.sentenceWords;
  for (const sentence of sentences(text)) if (wordCount(sentence) > longest) fault(section, `a sentence over ${longest} words`, "warn", sentence.slice(0, 60));
}

/** Caps per match and per day, openers that repeat, and phrases shared between matches or with past reports. `brief` is
 *  the day's facts: a phrase the writer was handed (a shot's words, a minute) is his to reuse, never an echo. */
export function dayFaults(pieces: readonly { code: number; prose: string; account: string; standfirst: string }[], names: readonly string[], brief: string, past: readonly string[], echo: number, fault: Report): void {
  for (const piece of pieces) {
    for (const over of overused(masked(piece.prose, names), REPORT_CAPPED_MATCH)) fault(`${piece.code}:match`, "a phrase used too often in one match", "send-back", over);
  }
  const all = masked(pieces.map((p) => p.prose).join(" "), names);
  for (const over of overused(all, REPORT_CAPPED_DAY)) fault("day", "a phrase used too often on the page", "send-back", over);
  const opener = (text: string, n: number) => text.toLowerCase().match(/[\p{L}\p{N}'’]+/gu)?.slice(0, n).join(" ") ?? "";
  const seen = new Map<string, number>();
  for (const piece of pieces) {
    for (const [key, text, n] of [["account", piece.account, 3], ["standfirst", piece.standfirst, 2]] as const) {
      const start = `${key}:${opener(text, n)}`;
      if (seen.has(start)) fault(`${piece.code}:${key}`, "opens like another match's", "send-back", start.split(":")[1]);
      else seen.set(start, piece.code);
    }
  }
  const said = new Map<string, number>();
  const echoes = new Map<number, number>();
  const echoed = (code: number) => (echoes.set(code, (echoes.get(code) ?? 0) + 1).get(code) ?? 0) <= ECHOES_QUOTED;
  const before = new Set(past.flatMap((text) => [...ngrams(text, echo, names)]));
  const handed = ngrams(brief, echo, names);
  for (const piece of pieces) {
    for (const gram of [...ngrams(piece.prose, echo, names)].filter((g) => !handed.has(g))) {
      if (said.has(gram) && said.get(gram) !== piece.code && echoed(piece.code)) fault(`${piece.code}:match`, "the same phrase as another match", "send-back", gram);
      if (!said.has(gram)) said.set(gram, piece.code);
      if (before.has(gram)) fault(`${piece.code}:match`, "a phrase from a recent report", "send-back", gram);
    }
  }
}

