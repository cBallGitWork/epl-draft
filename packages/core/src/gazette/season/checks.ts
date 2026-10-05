import { banned } from "../banned";
import { columnRules, lawroProse, type CheckContext, type Fault, type Report } from "../predictions/checks";
import { masked, mentionAt, sentences, wordCount } from "../predictions/prose";
import { REPORT_AMERICAN, REPORT_FPL } from "../reports/words";
import { AMERICAN_IZE, SHEETS_AMERICAN } from "../sheets/words";
import type { SeasonCalls } from "./calls";

// The editor on Lawro's season column: every rule his weekly column answers to, and the season's own. A hard fault
// never prints; a send-back goes back to him once, quoted.

/** What the model filed, keyed as the desk keys it. */
export interface SeasonDraft {
  deck: string;
  opening: string;
  title: string;
  playoffs: string;
  spoon: string;
  bold: string;
  /** Each side's line by team id. */
  table: ReadonlyMap<string, string>;
}

export const SEASON_SECTIONS = ["opening", "title", "playoffs", "spoon", "bold"] as const;
export type SeasonSection = (typeof SEASON_SECTIONS)[number];

/** A side's line is filed under this section. */
export const lineKey = (teamId: string) => `table:${teamId}`;

/** The machine, on top of his weekly lists. */
const SEASON_BANNED: readonly string[] = ["simulation", "simulations", "simulated", "simulate", "predicted XI", "predicted eleven", "expected points"];
const ORDINALS = ["first", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth", "ninth", "tenth", "eleventh", "twelfth"];
/** A draft has rounds and the paper never prints one (a round is a gameweek here); "built round" is not one. */
const DRAFT_ROUND = new RegExp(String.raw`\b(?:${ORDINALS.join("|")}|\d{1,2}(?:st|nd|rd|th)|this|the|a|next|late|early|later|earlier) round\b|\brounds\b`, "iu");
/** A place claimed for a side: "finish third", "come last", "fourth place", "top of the table"; never "the top four". */
const RANKED = `${ORDINALS.join("|")}|\\d{1,2}(?:st|nd|rd|th)`;
const PLACE = new RegExp(
  String.raw`\b(?:finish(?:es|ing)?|end(?:s|ing)? up|comes?|coming)\s+(?:in\s+)?(?:the\s+)?(${RANKED}|top|bottom|last)\b(?!\s+(?:four|4|two|three|half|six|end))|\b(${RANKED})\s+place\b|\b(top|bottom) of the (?:table|league|pile)\b|\bwooden spoon\b`,
  "giu",
);

/** `squads` is each side's men by name, for the line that must name only its own. */
export function checkSeason(draft: SeasonDraft, calls: SeasonCalls, squads: ReadonlyMap<string, readonly string[]>, ctx: CheckContext): Fault[] {
  const faults: Fault[] = [];
  const fault: Report = (section, check, severity, evidence) => faults.push({ section, check, severity, evidence });
  const sides = new Map(calls.sides.map((side) => [side.teamId, side]));
  const names = new Set(calls.sides.map((side) => side.name));
  const rules = lawroProse(ctx, names, fault);

  rules.deck(draft.deck);
  const prose: [section: string, text: string][] = [];
  for (const section of SEASON_SECTIONS) {
    if (draft[section].trim() === "") fault(section, "missing", "hard", "no paragraph");
    else prose.push([section, draft[section]]);
  }
  for (const side of calls.sides) {
    const line = draft.table.get(side.teamId) ?? "";
    if (line.trim() === "") fault(lineKey(side.teamId), "missing", "hard", "no line for this side");
    else prose.push([lineKey(side.teamId), line]);
  }

  for (const [section, text] of prose) {
    rules.section(section, text);
    seasonRules(section, text, calls, ctx.names, fault);
  }
  columnRules(draft.opening, prose, ctx, fault);
  lineRules(draft, calls, squads, fault);
  whoIsNamed(draft, calls, fault);
  return faults;

  function seasonRules(section: string, text: string, all: SeasonCalls, blanked: readonly string[], report: Report): void {
    const plain = masked(text, blanked);
    for (const word of banned(plain, [...SEASON_BANNED, ...REPORT_FPL])) report(section, "banned", "send-back", word);
    if (DRAFT_ROUND.test(plain)) report(section, "banned", "send-back", plain.match(DRAFT_ROUND)?.[0] ?? "");
    for (const word of banned(plain, [...SHEETS_AMERICAN, ...REPORT_AMERICAN])) report(section, "not British football English", "send-back", word);
    if (AMERICAN_IZE.test(plain)) report(section, "not British football English", "send-back", plain.match(AMERICAN_IZE)?.[0] ?? "");
    // A place beside one side must be the place the desk gave it.
    const own = section.startsWith("table:") ? sides.get(section.slice("table:".length)) : undefined;
    for (const sentence of sentences(text)) {
      const named = own !== undefined ? [own] : all.sides.filter((side) => mentionAt(sentence, side.name) !== -1);
      if (named.length !== 1) continue;
      for (const claim of sentence.matchAll(PLACE)) {
        const place = placeOf(claim, all.sides.length);
        if (place !== null && place !== named[0].place) report(section, "a place the desk did not give", "hard", `${named[0].name}: ${claim[0]}`);
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
    // Two sentences, and his kicker of three words at most on the end does not count as a third.
    const said = sentences(line);
    const count = said.length - (said.length > 1 && wordCount(said[said.length - 1]) <= 3 ? 1 : 0);
    if (count > 2 || wordCount(line) > 30) fault(key, "length", "send-back", `${said.length} sentences, ${wordCount(line)} words`);
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

/** Each paragraph names who it is about, and only the sides the desk put there. */
function whoIsNamed(draft: SeasonDraft, calls: SeasonCalls, fault: Report): void {
  const name = (teamId: string) => calls.sides.find((side) => side.teamId === teamId)?.name ?? teamId;
  const fifth = calls.fifth === null ? [] : [calls.fifth.teamId];
  const bold = calls.bold === null ? [] : [calls.bold.teamId];
  const cast: [section: SeasonSection, must: string[], may: string[]][] = [
    ["title", [calls.title.teamId], [calls.title.runnerUp]],
    ["playoffs", calls.four, fifth],
    ["spoon", [calls.spoon.teamId], [calls.spoon.ninth]],
    ["bold", bold, []],
  ];
  for (const [section, must, may] of cast) {
    const text = draft[section];
    if (text.trim() === "") continue;
    // Four sentences, so a question and its one-word answer still fit a three-sentence paragraph.
    if (sentences(text).length > 4 || wordCount(text) > 70) fault(section, "length", "send-back", `${sentences(text).length} sentences, ${wordCount(text)} words`);
    for (const teamId of must) if (mentionAt(text, name(teamId)) === -1) fault(section, "leaves out a side it is about", "send-back", name(teamId));
    for (const side of calls.sides) {
      if (![...must, ...may].includes(side.teamId) && mentionAt(text, side.name) !== -1) fault(section, "names a side the desk did not put here", "send-back", side.name);
    }
  }
}

/** The place a claim states: an ordinal, top, or bottom, last and the spoon at the foot of the table. */
function placeOf(claim: RegExpMatchArray, of: number): number | null {
  if (/wooden spoon/iu.test(claim[0])) return of;
  const word = (claim[1] ?? claim[2] ?? claim[3] ?? "").toLowerCase();
  if (word === "top") return 1;
  if (word === "bottom" || word === "last") return of;
  const at = ORDINALS.indexOf(word);
  if (at !== -1) return at + 1;
  const digits = Number(word.replace(/\D/gu, ""));
  return Number.isInteger(digits) && digits > 0 ? digits : null;
}

