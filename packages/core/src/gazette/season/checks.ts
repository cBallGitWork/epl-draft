import { banned } from "../banned";
import { columnRules, faultLog, lawroProse, type CheckContext, type Fault, type Report } from "../predictions/checks";
import { masked, mentionAt, sentences, wordCount } from "../predictions/prose";
import { REPORT_AMERICAN, REPORT_FPL } from "../reports/words";
import { AMERICAN_IZE, SHEETS_AMERICAN } from "../sheets/words";
import type { SeasonCalls } from "./calls";

// The editor on Lawro's power rankings: every rule his weekly column answers to, and the rankings' own. A hard fault
// never prints; a send-back goes back to him once, quoted.

/** What the model filed, keyed as the desk keys it. */
export interface SeasonDraft {
  deck: string;
  opening: string;
  /** Each side's line by team id. */
  table: ReadonlyMap<string, string>;
}

/** A side's line is filed under this section. */
export const lineKey = (teamId: string) => `table:${teamId}`;

/** The machine, FPL's own terms, and how a season ends: a ranking of squads as drafted says how strong they are,
 *  never where they finish. */
const SEASON_BANNED: readonly string[] = [
  "simulation", "simulations", "simulated", "simulate", "predicted XI", "predicted eleven", "expected points", ...REPORT_FPL,
  "playoff", "playoffs", "play-off", "play-offs", "play-in", "semi", "semis", "semi-final", "semi-finals",
  "straight through", "prize", "title", "champions", "finish", "finishes", "finishing", "finished",
  "top of the league", "bottom of the league", "top of the table", "bottom of the table", "the table", "league table",
  "wooden spoon", "spoon", "relegated", "relegation", "last place", "come last", "predicted", "prediction", "predictions",
];
const ORDINALS = ["first", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth", "ninth", "tenth", "eleventh", "twelfth"];
/** A draft has rounds and the paper never prints one (a round is a gameweek here); "built round" is not one. */
const DRAFT_ROUND = new RegExp(String.raw`\b(?:${ORDINALS.join("|")}|\d{1,2}(?:st|nd|rd|th)|this|the|a|next|late|early|later|earlier) round\b|\brounds\b`, "iu");
/** A place claimed for a side: "ranked third", "in at number four", "fifth place", "top of the pile", "the weakest squad"; a shirt number is not one. */
const RANKED = `${ORDINALS.join("|")}|\\d{1,2}(?:st|nd|rd|th)`;
const NUMBERS = ["one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
const PLACE = new RegExp(
  String.raw`\branked\s+(?:at\s+)?(?:number\s+)?(${RANKED}|\d{1,2}|${NUMBERS.join("|")})\b|\bin\s+at\s+number\s+(\d{1,2}|${NUMBERS.join("|")})\b|\b(${RANKED})\s+place\b|\b(top|bottom) of the (?:pile|heap|list|rankings|pecking order|tree)\b|(?<!(?:${RANKED})[-\s])\b(strongest|best|weakest|worst|poorest|feeblest)\s+(?:squad|side|team)\b(?!\s+(?:bar|but|save|except)\b)`,
  "giu",
);

/** `squads` is each side's men by name, for the line that must name only its own. */
export function checkSeason(draft: SeasonDraft, calls: SeasonCalls, squads: ReadonlyMap<string, readonly string[]>, ctx: CheckContext): Fault[] {
  const { faults, fault } = faultLog();
  const sides = new Map(calls.sides.map((side) => [side.teamId, side]));
  const rules = lawroProse(ctx, new Set(calls.sides.map((side) => side.name)), fault);

  rules.deck(draft.deck);
  rankingRules("deck", draft.deck);
  const prose: [section: string, text: string][] = [];
  if (draft.opening.trim() === "") fault("opening", "missing", "hard", "no opening");
  else prose.push(["opening", draft.opening]);
  for (const side of calls.sides) {
    const line = draft.table.get(side.teamId) ?? "";
    if (line.trim() === "") fault(lineKey(side.teamId), "missing", "hard", "no line for this side");
    else prose.push([lineKey(side.teamId), line]);
  }

  for (const [section, text] of prose) {
    rules.section(section, text);
    rankingRules(section, text);
  }
  columnRules(draft.opening, prose, ctx, fault);
  lineRules(draft, calls, squads, fault);
  openingRules(draft.opening, calls, fault);
  return faults;

  function rankingRules(section: string, text: string): void {
    const plain = masked(text, ctx.names);
    for (const word of banned(plain, SEASON_BANNED)) fault(section, "banned", "send-back", word);
    if (DRAFT_ROUND.test(plain)) fault(section, "banned", "send-back", plain.match(DRAFT_ROUND)?.[0] ?? "");
    for (const word of banned(plain, [...SHEETS_AMERICAN, ...REPORT_AMERICAN])) fault(section, "not British football English", "send-back", word);
    if (AMERICAN_IZE.test(plain)) fault(section, "not British football English", "send-back", plain.match(AMERICAN_IZE)?.[0] ?? "");
    // A place beside one side must be the place the desk gave it.
    const own = section.startsWith("table:") ? sides.get(section.slice("table:".length)) : undefined;
    for (const sentence of sentences(text)) {
      const named = own !== undefined ? [own] : calls.sides.filter((side) => mentionAt(sentence, side.name) !== -1);
      if (named.length !== 1) continue;
      for (const claim of sentence.matchAll(PLACE)) {
        const place = placeOf(claim, calls.sides.length);
        if (place !== null && place !== named[0].place) fault(section, "a place the desk did not give", "hard", `${named[0].name}: ${claim[0]}`);
      }
    }
  }
}

/** Each side's line: its length, a fresh opening, and no other side and no other squad's man in it. */
function lineRules(draft: SeasonDraft, calls: SeasonCalls, squads: ReadonlyMap<string, readonly string[]>, fault: Report): void {
  const openings = new Map<string, string>();
  for (const side of calls.sides) {
    const line = draft.table.get(side.teamId) ?? "";
    if (line.trim() === "") continue;
    const key = lineKey(side.teamId);
    if (counted(line) > 2 || wordCount(line) > 30) fault(key, "length", "send-back", `${sentences(line).length} sentences, ${wordCount(line)} words`);
    const opening = (line.toLowerCase().match(/[\p{L}'’]+/gu) ?? []).slice(0, 2).join(" ");
    if (openings.has(opening)) fault(key, "opens like another side's line", "send-back", opening);
    else openings.set(opening, side.teamId);
    for (const other of calls.sides) if (other.teamId !== side.teamId && mentionAt(line, other.name) !== -1) fault(key, "names another side", "send-back", other.name);
    const mine = new Set(squads.get(side.teamId) ?? []);
    for (const [teamId, men] of squads) {
      if (teamId === side.teamId) continue;
      for (const man of men) if (!mine.has(man) && mentionAt(line, man) !== -1) fault(key, "a man from another squad", "hard", man);
    }
  }
}

/** The opening: two or three sentences, naming only the strongest and the weakest squads the brief gave it. */
function openingRules(opening: string, calls: SeasonCalls, fault: Report): void {
  if (opening.trim() === "") return;
  const said = counted(opening);
  if (said < 2 || said > 3) fault("opening", "length", "send-back", `${sentences(opening).length} sentences, ${wordCount(opening)} words`);
  const may = [calls.sides[0].teamId, calls.sides[calls.sides.length - 1].teamId];
  for (const side of calls.sides) {
    if (!may.includes(side.teamId) && mentionAt(opening, side.name) !== -1) fault("opening", "names a side the desk did not put here", "send-back", side.name);
  }
}

/** Sentences that count towards a length: his kicker, or a one-word answer to his own question, of three words at most does not. */
function counted(text: string): number {
  return sentences(text).filter((sentence) => wordCount(sentence) > 3).length;
}

/** The place a claim states: an ordinal or a number, the top or bottom of the pile, or the strongest or weakest squad. */
function placeOf(claim: RegExpMatchArray, of: number): number | null {
  const word = (claim[1] ?? claim[2] ?? claim[3] ?? claim[4] ?? claim[5] ?? "").toLowerCase();
  if (word === "top" || word === "strongest" || word === "best") return 1;
  if (["bottom", "weakest", "worst", "poorest", "feeblest"].includes(word)) return of;
  for (const list of [ORDINALS, NUMBERS]) if (list.includes(word)) return list.indexOf(word) + 1;
  const digits = Number(word.replace(/\D/gu, ""));
  return Number.isInteger(digits) && digits > 0 ? digits : null;
}
