import { BANNED, banned, escapeRegExp } from "../banned";
import { strangers } from "../strangers";
import { CORE_MARK, type PastLine } from "./past";
import type { PredictionCall } from "./pick";
import { masked, mentionAt, ngrams, numbersIn, sentences, wordCount } from "./prose";
import { COMFORTABLE, DESK_BANNED, LAWRO_BANNED, LAWRO_CAPPED, LAWRO_FAMOUS, LAWRO_NEVER, LINEUP_CLAIMS } from "./words";

// The editor: every rule Lawro is given, checked after he files. A hard fault never prints; a
// send-back goes back to him once, quoted; a warning is a line in the log.

export type Severity = "hard" | "send-back" | "warn";

export interface Fault {
  /** "intro", "deck", "column", or a tie's key. */
  section: string;
  check: string;
  severity: Severity;
  evidence: string;
}

/** What the model filed, keyed as the desk keys ties. */
export interface LawroDraft {
  deck: string;
  intro: string;
  ties: ReadonlyMap<string, { line: string; backs: string | null }>;
}

export const tieKey = (homeTeamId: string, awayTeamId: string) => `${homeTeamId}-${awayTeamId}`;

export interface CheckContext {
  calls: readonly PredictionCall[];
  name: (teamId: string) => string;
  /** The brief, his core and this week's lines: all a sentence may name or count. */
  facts: string;
  offered: readonly PastLine[];
  /** Names blanked before the word lists run: the managers' sides and their men. */
  names: readonly string[];
  /** The prose of his earlier columns, newest first. */
  past: readonly string[];
}

const CAREER_CLAIM = /\bI (?:played|scored|managed|won(?!['’]t)|signed|coached|captained|commentated|covered)\b|\bwhen I was at\b|\bin my day\b|\bmy (?:playing days|career|debut|caps|medals)\b/iu;
const TICS: readonly (readonly [check: string, pattern: RegExp])[] = [
  ["semicolon", /;/u],
  ["colon", /:/u],
  ["brackets", /[()[\]]/u],
  ["trailing dots", /\.{2,}|…/u],
  ["we, us, our", /\b(?:we|us|our|ours)\b/iu],
  ["a league side at home", /\b(?:welcomes?|welcomed|visitors|home advantage)\b/iu],
  ["a sentence opening on So", /(?:^|[.?]\s+)So\b/u],
  ["not just X but Y", /(?:\bnot|n't) (?:just|only|merely|simply)\b|\b(?:it|that|this)(?:'s| is| was)(?: not|n't)\b[^.?]{1,50},\s*(?:it|that|this)(?:'s| is| was)\b/iu],
  ["no X, no Y, no Z", /\b[Nn]o \p{L}+, no \p{L}+,? (?:and )?no \p{L}+/u],
];
/** What only a real club does: "Liverpool host City" is his to write, a league side hosting nobody's. */
const AT_HOME = String.raw`\s+(?:hosts?|hosted|hosting|visits?|visited|visiting|travels?|travelled|travelling)\b`;
const QUOTES = /["“”«»]|‘[^’]*’/u;
const WIN = /\b(?:will|'ll|to|should|can|could|might|going to) (?:win|beat|edge|nick|take it|do it)\b/iu;
const BACKING = /\b(?:I fancy|I'm backing|I'll go with|I'm going with|I'll have|backing)\b/iu;
const NEGATION = /\b(?:not|never|no)\b|n't/iu;
const SCORELINE = /\b(?!50-50\b)\d{1,3}\s*[-–]\s*\d{1,3}\b/u;
const ADMISSION = ["Liverpool man", "Liverpool men", "Liverpool player", "Liverpool players", "Liverpool lad", "Liverpool lads", "Anfield man", "in red"];
const LIMITS = { sentence: 20, intro: [1, 4, 40], tie: [2, 8, 120], gut: [2, 9, 130], column: 680, repeat: 5, echo: 4, men: 4, questions: 2 } as const;
/** His verdict is his: a tie with no "I", "me" or "my" in it is a list of facts, not an opinion. */
const VERDICT = /\b(?:I|me|my)\b|\bI['’]/u;

export function checkLawro(draft: LawroDraft, ctx: CheckContext): Fault[] {
  const faults: Fault[] = [];
  const fault = (section: string, check: string, severity: Severity, evidence: string) => faults.push({ section, check, severity, evidence });
  const sides = new Set(ctx.calls.flatMap((call) => [ctx.name(call.homeTeamId), ctx.name(call.awayTeamId)]));
  const rules = lawroProse(ctx, sides, fault);

  rules.deck(draft.deck);
  const prose: [section: string, text: string][] = [["intro", draft.intro]];
  for (const call of ctx.calls) {
    const key = tieKey(call.homeTeamId, call.awayTeamId);
    const entry = draft.ties.get(key);
    if (entry === undefined || entry.line.trim() === "") {
      fault(key, "missing", "hard", "no line for this tie");
      continue;
    }
    if (entry.backs !== call.callsTeamId) fault(key, "backs another side", "hard", String(entry.backs));
    prose.push([key, entry.line]);
    tieRules(key, entry.line, call, ctx, sides, fault);
  }

  for (const [section, text] of prose) rules.section(section, text);
  columnRules(draft.intro, prose, ctx, fault);
  return faults;
}

/** The rules every line of his answers to, wherever it prints: the deck's, and any section of his own prose. */
export function lawroProse(ctx: CheckContext, sides: ReadonlySet<string>, fault: Report): { deck: (text: string) => void; section: (section: string, text: string) => void } {
  const offered = ctx.offered.map((line) => line.line).join(" ").toLowerCase();
  const exempt = (list: readonly string[]) => list.filter((phrase) => !offered.includes(phrase.toLowerCase()));
  const never = LAWRO_NEVER.filter((word) => !ctx.facts.toLowerCase().includes(word.toLowerCase()));
  const known = new Set(numbersIn(ctx.facts));

  const everywhere = (section: string, text: string, words: readonly string[]) => {
    for (const pattern of LINEUP_CLAIMS) if (pattern.test(text)) fault(section, "line-up", "hard", text.match(pattern)?.[0] ?? "");
    if (QUOTES.test(text)) fault(section, "quotation marks", "hard", text.match(QUOTES)?.[0] ?? "");
    if (/\d\.\d/u.test(text)) fault(section, "a decimal", "hard", text.match(/\d+\.\d+/u)?.[0] ?? "");
    for (const word of banned(text, never)) fault(section, "never", "hard", word);
    // "I'll" is a capital that is nobody, and so is a word standing as its own sentence: "Lovely."
    const alone = new Set(sentences(text).map((sentence) => sentence.replace(/[.?!]+$/u, "")));
    for (const name of strangers(text, ctx.facts).filter((word) => !/^I['’]/u.test(word) && !alone.has(word))) fault(section, "a name not in the brief", "hard", name);
    for (const figure of numbersIn(text)) if (!known.has(figure)) fault(section, "a figure not in the brief", "hard", String(figure));
    const plain = masked(text, ctx.names);
    for (const word of [...banned(plain, BANNED), ...banned(plain, words)]) fault(section, "banned", "send-back", word);
  };

  return {
    deck: (text) => everywhere("deck", text, DESK_BANNED),
    section: (section, text) => {
      everywhere(section, text, exempt([...LAWRO_BANNED, ...LAWRO_FAMOUS]));
      for (const [check, pattern] of TICS) if (pattern.test(text)) fault(section, check, "send-back", text.match(pattern)?.[0] ?? "");
      for (const side of sides) {
        const hosting = text.match(new RegExp(`${escapeRegExp(side)}${AT_HOME}`, "iu"));
        if (hosting !== null) fault(section, "a league side at home", "send-back", hosting[0]);
      }
      for (const sentence of sentences(text)) {
        if (wordCount(sentence) > LIMITS.sentence) fault(section, "a sentence over 20 words", "send-back", sentence);
        if (CAREER_CLAIM.test(sentence) && !CORE_MARK.test(sentence) && !ctx.offered.some((line) => line.mark.test(sentence))) {
          fault(section, "a career claim nobody gave him", "hard", sentence);
        }
      }
    },
  };
}

/** Where a check files a fault: the section it is in, the rule, how hard, and the words that broke it. */
export type Report = (section: string, check: string, severity: Severity, evidence: string) => void;

function tieRules(key: string, line: string, call: PredictionCall, ctx: CheckContext, sides: ReadonlySet<string>, fault: Report): void {
  const [least, most, words] = call.instinct === null ? LIMITS.tie : LIMITS.gut;
  const count = sentences(line).length;
  if (count < least || count > most || wordCount(line) > words) fault(key, "length", "send-back", `${count} sentences, ${wordCount(line)} words`);
  if (SCORELINE.test(line)) fault(key, "a score in the prose", "hard", line.match(SCORELINE)?.[0] ?? "");
  if (!VERDICT.test(line)) fault(key, "no verdict of his own", "send-back", line.slice(0, 60));
  const men = ctx.names.filter((name) => !sides.has(name) && mentionAt(line, name) !== -1);
  if (men.length > LIMITS.men) fault(key, "a roll call, more than four men", "send-back", men.join(", "));
  // "Their Ballard" is not how anybody talks (Craig): Ballard, or test31's Ballard.
  for (const name of men) {
    const owned = line.match(new RegExp(`\\b(?:their|his|our) ${escapeRegExp(name)}\\b`, "iu"));
    if (owned !== null) fault(key, "a possessive before a name", "send-back", owned[0]);
  }
  if (call.close) for (const word of banned(line, COMFORTABLE)) fault(key, "an easy win on a close tie", "send-back", word);
  // He never admitted the bias (Craig): on a Liverpool call, their club is not the reason.
  if (call.instinct === "liverpool") for (const word of banned(line, ADMISSION)) fault(key, "gives Liverpool as the reason", "send-back", word);
  if (call.callsTeamId === null) return;
  const other = ctx.name(call.callsTeamId === call.homeTeamId ? call.awayTeamId : call.homeTeamId);
  for (const sentence of sentences(line)) {
    if (!sentence.includes(other) || NEGATION.test(sentence)) continue;
    if (WIN.test(sentence) || new RegExp(`${BACKING.source}\\s+${escapeRegExp(other)}`, "iu").test(sentence)) {
      fault(key, "argues for the other side", "hard", sentence);
    }
  }
}

export function columnRules(intro: string, prose: readonly [string, string][], ctx: CheckContext, fault: Report): void {
  const [least, most, words] = LIMITS.intro;
  const count = sentences(intro).length;
  if (count < least || count > most || wordCount(intro) > words) fault("intro", "length", "send-back", `${count} sentences, ${wordCount(intro)} words`);
  const all = prose.map(([, text]) => text).join(" ");
  if (wordCount(all) > LIMITS.column) fault("column", "length", "send-back", `${wordCount(all)} words`);
  if ((all.match(/\?/gu) ?? []).length > LIMITS.questions) fault("column", "more than two questions", "send-back", "?");
  for (const [phrase, cap] of LAWRO_CAPPED) {
    const used = (all.match(new RegExp(`(?<![\\p{L}])${escapeRegExp(phrase)}(?![\\p{L}])`, "giu")) ?? []).length;
    if (used > cap) fault("column", "a habit used too often", "send-back", `${phrase} ×${used}`);
  }
  // Five ties in one column, and a reader hears the same words coming round (Craig).
  const said = new Map<string, string>();
  for (const [section, text] of prose) {
    const echo = [...ngrams(text, LIMITS.echo, ctx.names)].find((gram) => said.has(gram) && said.get(gram) !== section);
    if (echo !== undefined) fault(section, "the same phrase as another tie", "send-back", echo);
    for (const gram of ngrams(text, LIMITS.echo, ctx.names)) if (!said.has(gram)) said.set(gram, section);
  }
  const before = new Set(ctx.past.slice(0, 6).flatMap((text) => [...ngrams(text, LIMITS.repeat, ctx.names)]));
  for (const [section, text] of prose) {
    const repeated = [...ngrams(text, LIMITS.repeat, ctx.names)].find((gram) => before.has(gram));
    if (repeated !== undefined) fault(section, "a phrase from a recent column", "send-back", repeated);
  }
  const lengths = sentences(all).map(wordCount);
  const mean = lengths.length === 0 ? 0 : lengths.reduce((sum, n) => sum + n, 0) / lengths.length;
  if (mean > 12) fault("column", "long sentences on average", "warn", `${mean.toFixed(1)} words`);
}

/** The sub-editor's pencil: the trivial slips fixed rather than sent back. */
export function pencil(text: string): string {
  return text
    .replace(/(\d)\s*[–—]\s*(\d)/gu, "$1-$2")
    .replace(/\s+[—–]\s+|\s+--\s+|—/gu, ", ")
    .replace(/!/gu, ".")
    .replace(/(^|[.?]\s+)So,\s+(\p{Ll})/gu, (_, lead: string, next: string) => `${lead}${next.toUpperCase()}`);
}
