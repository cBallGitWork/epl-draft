import { SHEETS } from "../../config";
import { BANNED, banned } from "../banned";
import type { Fault, Severity } from "../predictions/checks";
import { masked, ngrams, numbersIn, sentences, wordCount } from "../predictions/prose";
import { DESK_BANNED } from "../predictions/words";
import { strangers } from "../strangers";
import { sheetsKey, type SheetsDraft } from "./column";
import type { TeamFacts, TieFacts } from "./facts";
import { SHEETS_AMERICAN, SHEETS_HOUSE, SHEETS_LEXICON } from "./words";

// The editor for team news: every paragraph read against the facts it was written from. A hard
// fault never prints (the side takes the desk's plain line); a send-back goes back once, quoted.

/** Opinion, which a team-news item never carries: it reports the sheet and stops. */
export const SHEETS_OPINION: readonly string[] = [
  "bold", "brave", "gamble", "gambles", "risk", "risky", "surprise", "surprising", "surprisingly", "shock", "shocking",
  "curious", "curiously", "baffling", "bizarre", "strange", "strangely", "questionable", "puzzling", "odd", "oddly",
  "impressive", "strong", "stronger", "weak", "weaker", "fresh", "confident", "confidence", "faith", "trust", "trusts",
  "key", "big", "should", "shouldn't", "must", "expect", "expects", "likely", "unlikely", "hope", "hopes",
  "will", "would", "clearly", "obviously", "perhaps", "presumably", "rewarded", "punished", "harsh",
  "unlucky", "lucky", "decision", "rating", "rates", "rated", "in line to", "opts", "opted", "elects", "elected", "chooses", "chose", "preferred",
];

const QUOTES = /["“”«»]/u;
/** Where a fact came from stays off the page: a reporter does not cite his workings. */
const SOURCE = /%|\bper ?cent\b|\b(?:projected|projections?|predicted|predictions?|model|FPL|Fantrax)\b/iu;
/** Unchanged is the whole of it (Craig, 26 Sep 2026): never how many rounds it has been. */
/** The game is still to come (Craig, 26 Sep 2026): "might have started" is a match already played. */
const PAST = /\b(?:might|could|would|should|may) have\b|\b(?:might|could|would|should|may)'ve\b/iu;
const COUNTED = /\b(?:(?:second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|\d+(?:st|nd|rd|th)) (?:week|round|game|gameweek)|(?:weeks?|rounds?) running|in a row|on the (?:trot|spin))\b/iu;
const COUNT = /\b([\p{L}\d]+) changes?\b/iu;
const WORDS: Record<string, number> = { no: 0, one: 1, a: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11 };

export interface SheetsCheck {
  ties: readonly TieFacts[];
  /** The brief: every name and figure a paragraph may use. */
  facts: string;
}

export function checkSheets(draft: SheetsDraft, ctx: SheetsCheck): Fault[] {
  const faults: Fault[] = [];
  const fault: Report = (section, check, severity, evidence) => faults.push({ section, check, severity, evidence });
  const names = ctx.ties.flatMap((tie) => [tie.home, tie.away]).flatMap((team) => [team.sheet.teamName, ...[...team.sheet.starters, ...team.sheet.bench].map((man) => man.player.name)]);
  const known = new Set([...numbersIn(ctx.facts), ...ctx.ties.flatMap(counts)]);
  const openers = new Map<string, string>();
  const said = new Map<string, string>();

  const common = (section: string, text: string) => {
    if (QUOTES.test(text)) fault(section, "quotation marks", "hard", text.match(QUOTES)?.[0] ?? "");
    if (SOURCE.test(text)) fault(section, "names a source or a percentage", "hard", text.match(SOURCE)?.[0] ?? "");
    if (PAST.test(text)) fault(section, "the wrong tense: the match is still to come", "send-back", text.match(PAST)?.[0] ?? "");
    if (COUNTED.test(text)) fault(section, "counts the gameweeks", "send-back", text.match(COUNTED)?.[0] ?? "");
    for (const name of strangers(text, ctx.facts)) fault(section, "a name not in the brief", "hard", name);
    for (const figure of numbersIn(text)) if (!known.has(figure)) fault(section, "a figure not in the brief", "hard", String(figure));
    for (const word of banned(masked(text, names), [...BANNED, ...DESK_BANNED, ...SHEETS_OPINION])) fault(section, "opinion or banned phrasing", "send-back", word);
    for (const word of banned(masked(text, names), SHEETS_AMERICAN)) fault(section, "not British football English", "send-back", word);
    for (const [not, say] of SHEETS_HOUSE) if (banned(masked(text, names), [not]).length > 0) fault(section, `say ${say}, not ${not}`, "send-back", not);
  };

  for (const team of ctx.ties.flatMap((tie) => [tie.home, tie.away])) {
    const section = team.sheet.teamId;
    const text = draft.get(section) ?? "";
    if (text.trim() === "") {
      fault(section, "missing", "hard", "no paragraph for this side");
      continue;
    }
    common(section, text);
    facts(section, text, team, fault);
    const count = sentences(text).length;
    if (count > SHEETS.sentences || wordCount(text) > SHEETS.words) fault(section, "length", "send-back", `${count} sentences, ${wordCount(text)} words`);
    const opener = masked(text, names).toLowerCase().match(/[\p{L}\p{N}'’\u0000]+/gu)?.slice(0, 3).join(" ") ?? "";
    if (openers.has(opener)) fault(section, "opens like another side's paragraph", "send-back", opener);
    else openers.set(opener, section);
    for (const gram of ngrams(text, SHEETS.echo, names)) {
      if (said.has(gram) && said.get(gram) !== section) fault(section, "the same phrase as another side", "send-back", gram);
      if (!said.has(gram)) said.set(gram, section);
    }
    const last = team.lastWrote === null ? new Set<string>() : ngrams(team.lastWrote, SHEETS.echo, names);
    const echoed = [...ngrams(text, SHEETS.echo, names)].find((gram) => last.has(gram));
    if (echoed !== undefined) fault(section, "a phrase from last round's article", "send-back", echoed);
  }

  const all = masked([...draft.values()].join(" "), names);
  for (const [phrase, most] of SHEETS_LEXICON) {
    const used = (all.match(new RegExp(`(?<![\\p{L}])${phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![\\p{L}])`, "giu")) ?? []).length;
    if (used > most) fault("article", "a phrase used too often", "send-back", `${phrase} ×${used}`);
  }

  for (const tie of ctx.ties) {
    const section = sheetsKey(tie.home.sheet.teamId, tie.away.sheet.teamId);
    const text = draft.get(section) ?? "";
    if (text.trim() === "") continue;
    if (tie.meets.length === 0) fault(section, "a meeting the brief does not give", "hard", text.slice(0, 60));
    common(section, text);
    if (sentences(text).length > 1 || wordCount(text) > SHEETS.betweenWords) fault(section, "length", "send-back", `${wordCount(text)} words`);
  }
  return faults;
}

type Report = (section: string, check: string, severity: Severity, evidence: string) => void;

/** The claims a paragraph can get wrong about its own side: how many changes, debuts, unchanged. */
function facts(section: string, text: string, team: TeamFacts, fault: Report): void {
  const stated = text.match(COUNT);
  const figure = stated === null ? Number.NaN : (WORDS[stated[1].toLowerCase()] ?? Number(stated[1]));
  if (stated !== null && !Number.isNaN(figure)) {
    if (team.changes === null) fault(section, "changes on a first sheet", "hard", stated[0]);
    else if (figure !== team.changes.count) fault(section, "the wrong number of changes", "hard", `${stated[0]}, not ${team.changes.count}`);
  }
  if (/\bdebut/iu.test(text) && (team.debuts ?? []).length === 0) fault(section, "a debut the brief does not give", "hard", "debut");
  if (/\bunchanged\b|\bsame (?:eleven|side|xi)\b/iu.test(text) && team.changes?.count !== 0) fault(section, "unchanged when it changed", "hard", "unchanged");
  // Dropped is a man who started last round and is benched now; the facts say who, if anyone.
  const dropped = (team.changes?.out ?? []).some((each) => each.to === "bench") || team.benchings.some((each) => each.dropped);
  if (/\bdrop(?:s|ped|ping)?\b/iu.test(text) && !dropped) fault(section, "a man dropped the brief does not give", "hard", "dropped");
}

/** Every count a paragraph may state that the brief lists rather than numbers: "two Arsenal defenders". */
function counts(tie: TieFacts): number[] {
  const side = (team: TeamFacts) => [
    team.sheet.starters.length, team.sheet.bench.length, team.changes?.in.length ?? 0, team.changes?.out.length ?? 0,
    team.debuts?.length ?? 0, team.benchings.length, team.flags.length,
  ];
  const meets = tie.meets.flatMap((meet) => (meet.kind === "facing" ? [meet.attackers.length, meet.defenders.length] : [meet.home.length, meet.away.length]));
  return [...side(tie.home), ...side(tie.away), ...meets];
}
