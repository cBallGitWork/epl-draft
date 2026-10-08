import { SHEETS } from "../../config";
import { BANNED, americanisms, banned } from "../banned";
import { escapeRegExp } from "../../regExp";
import { faultLog, type Fault, type Report } from "../predictions/checks";
import { masked, ngrams, numbersIn, sentences, wordCount } from "../predictions/prose";
import { DESK_BANNED } from "../predictions/words";
import { strangers } from "../strangers";
import type { SheetsDraft } from "./column";
import type { TeamFacts, TieFacts } from "./facts";
import { printName } from "./sheet";
import { SHEETS_AMERICAN, SHEETS_CAPPED, SHEETS_ELSEWHERE, SHEETS_HOUSE, SHEETS_LEXICON, SHEETS_STOCK } from "./words";

// The editor for team news: every paragraph read against the facts it was written from. A hard
// fault never prints (the side takes the desk's plain line); a send-back goes back once, quoted,
// and one in FINAL_HARD that survives the rewrite is treated as hard.

/** Opinion, which a team-news item never carries: it reports the sheet and stops. */
export const SHEETS_OPINION: readonly string[] = [
  "bold", "brave", "gamble", "gambles", "risk", "risky", "surprise", "surprising", "surprisingly", "shock", "shocking",
  "curious", "curiously", "baffling", "bizarre", "strange", "strangely", "questionable", "puzzling", "odd", "oddly",
  "impressive", "strong", "stronger", "weak", "weaker", "fresh", "confident", "confidence", "faith", "trust", "trusts",
  "key", "big", "should", "shouldn't", "must", "expect", "expects", "likely", "unlikely", "hope", "hopes",
  "will", "would", "clearly", "obviously", "perhaps", "presumably", "rewarded", "punished", "harsh",
  "unlucky", "lucky", "decision", "rating", "rates", "rated", "in line to", "opts", "opted", "elects", "elected",
  "chooses", "chose", "preferred", "worry", "worries", "worried", "concern", "concerns", "concerning", "blow",
  "boost", "managed", "manages",
];

/** The send-backs that are facts, not style: surviving the rewrite, the side prints the desk's line. */
export const FINAL_HARD: ReadonlySet<string> = new Set(["an absence understated", "a manager names, a club starts", "a man owns no club"]);

const QUOTES = /["“”«»]/u;
/** Where a fact came from stays off the page: a reporter does not cite his workings. */
export const SOURCE = /%|\bper ?cent\b|\b(?:projected|projections?|predicted|predictions?|model|FPL|Fantrax|according to|The Athletic)\b|\bper (?!cent)\p{L}/iu;
/** The game is still to come: "might have started" is a match already played. */
const PAST = /\b(?:might|could|would|should|may) have\b|\b(?:might|could|would|should|may)'ve\b/iu;
/** Unchanged is the whole of it: never how many gameweeks, nor a season's count. */
export const COUNTED = /\b(?:(?:second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|\d+(?:st|nd|rd|th)) (?:week|round|game|gameweek)|(?:weeks?|rounds?) running|in a row|on the (?:trot|spin)|all (?:two|three|four|five|six|seven|eight|nine|ten|\d+) (?:\p{L}+ )?(?:matches|games|starts|appearances)|this season)\b/iu;
/** A manager names a man; his club starts him. "might not start for" is the club's. */
const STARTS = /(?<!not |n't )\bstarts? (?:for|against)\b/iu;
/** Said of a man who is out, a sentence names the absence and softens nothing. */
const OUT_WORDS = /\b(?:out|ruled out|injured|sidelined|suspended|banned|serving a ban|unavailable|misses|miss|absent)\b/iu;
const SOFT_WORDS = /\b(?:doubt|doubtful|carrying|awaits?|awaiting|scan|MRI|fitness test|might not|worry)\b/iu;
const COUNT = /\b([\p{L}\d]+) changes?\b/iu;
const WORDS: Record<string, number> = { no: 0, one: 1, a: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11 };

export interface SheetsCheck {
  ties: readonly TieFacts[];
  /** The brief: every name a paragraph may use. */
  facts: string;
  /** Every club's name as the paper prints it, so a man is never written as owning one. */
  clubs: readonly string[];
}


export function checkSheets(draft: SheetsDraft, ctx: SheetsCheck): Fault[] {
  const { faults, fault } = faultLog();
  const teams = ctx.ties.flatMap((tie) => [tie.home, tie.away]);
  const men = teams.flatMap((team) => [...team.sheet.starters, ...team.sheet.bench]).flatMap((man) => [man.player.name, printName(man.player)]);
  const names = [...teams.map((team) => team.sheet.teamName), ...men];
  // Figures from the facts, never from the brief's prose: a date or a news figure let anything through.
  const known = new Set(ctx.ties.flatMap(figures));
  const owns = ctx.clubs.length === 0 ? null : new RegExp(`\\u0000['’]s (?:${ctx.clubs.map(escapeRegExp).join("|")})\\b`, "u");

  const common = (section: string, text: string) => {
    const plain = masked(text, names);
    if (QUOTES.test(text)) fault(section, "quotation marks", "hard", text.match(QUOTES)?.[0] ?? "");
    if (SOURCE.test(text)) fault(section, "names a source or a percentage", "hard", text.match(SOURCE)?.[0] ?? "");
    if (PAST.test(text)) fault(section, "the wrong tense: the match is still to come", "send-back", text.match(PAST)?.[0] ?? "");
    if (COUNTED.test(text)) fault(section, "counts the gameweeks", "send-back", text.match(COUNTED)?.[0] ?? "");
    if (STARTS.test(text)) fault(section, "a manager names, a club starts", "send-back", text.match(STARTS)?.[0] ?? "");
    if (owns !== null && owns.test(masked(text, men))) fault(section, "a man owns no club", "send-back", "a player's name before a club's");
    for (const name of strangers(text, ctx.facts)) fault(section, "a name not in the brief", "hard", name);
    // Names blanked first: a side called "123" is a name, not a figure.
    for (const figure of numbersIn(plain)) if (!known.has(figure)) fault(section, "a figure not in the brief", "hard", String(figure));
    for (const word of banned(plain, [...BANNED, ...DESK_BANNED, ...SHEETS_OPINION])) fault(section, "opinion or banned phrasing", "send-back", word);
    for (const word of americanisms(plain, SHEETS_AMERICAN)) fault(section, "not British football English", "send-back", word);
    for (const phrase of banned(plain, SHEETS_STOCK)) fault(section, "a stock phrase no reporter uses", "send-back", phrase);
    for (const word of banned(plain, SHEETS_ELSEWHERE)) fault(section, "not this gameweek's news", "send-back", word);
    for (const [not, say] of SHEETS_HOUSE) if (banned(plain, [not]).length > 0) fault(section, `say ${say}, not ${not}`, "send-back", not);
  };

  const openers = new Map<string, number>();
  const said = new Map<string, string>();
  let unchangedLeads = 0;
  for (const team of teams) {
    const section = team.sheet.teamId;
    const text = draft.get(section) ?? "";
    if (text.trim() === "") {
      fault(section, "missing", "hard", "no paragraph for this side");
      continue;
    }
    common(section, text);
    claims(section, text, team, fault);
    const count = sentences(text).length;
    if (count > SHEETS.sentences || wordCount(text) > SHEETS.words) fault(section, "length", "send-back", `${count} sentences, ${wordCount(text)} words`);
    if (/\bunchanged\b|\bsame (?:starting )?(?:line-up|eleven|side|xi)\b/iu.test(sentences(text)[0] ?? "") && ++unchangedLeads > 1) {
      fault(section, "leads on unchanged, as another side does", "send-back", sentences(text)[0] ?? "");
    }
    // Two sides may both lead on a man who is out; a third opening the same way is a template.
    const opener = masked(text, names).toLowerCase().match(/[\p{L}\p{N}'’\u0000]+/gu)?.slice(0, 3).join(" ") ?? "";
    openers.set(opener, (openers.get(opener) ?? 0) + 1);
    if ((openers.get(opener) ?? 0) > SHEETS.openers) fault(section, "opens like other sides' paragraphs", "send-back", opener);
    for (const gram of ngrams(text, SHEETS.echo, names)) {
      if (said.has(gram) && said.get(gram) !== section) fault(section, "the same phrase as another side", "send-back", gram);
      if (!said.has(gram)) said.set(gram, section);
    }
    const last = team.lastWrote === null ? new Set<string>() : ngrams(team.lastWrote, SHEETS.echo, names);
    const echoed = [...ngrams(text, SHEETS.echo, names)].find((gram) => last.has(gram));
    if (echoed !== undefined) fault(section, "a phrase from last gameweek's article", "send-back", echoed);
  }

  const all = masked([...draft.values()].join(" "), names);
  for (const [phrase, most] of [...SHEETS_LEXICON, ...SHEETS_CAPPED]) {
    const used = (all.match(new RegExp(`(?<![\\p{L}])${escapeRegExp(phrase)}(?![\\p{L}])`, "giu")) ?? []).length;
    if (used > most) fault("article", "a phrase used too often", "send-back", `${phrase} ×${used}`);
  }
  return faults;
}

/** The claims a paragraph can get wrong about its own side: the changes, debuts, unchanged, a man
 *  dropped, and a man who is out. */
function claims(section: string, text: string, team: TeamFacts, fault: Report): void {
  const stated = text.match(COUNT);
  const figure = stated === null ? Number.NaN : (WORDS[stated[1].toLowerCase()] ?? Number(stated[1]));
  if (stated !== null && !Number.isNaN(figure)) {
    if (team.changes === null) fault(section, "changes on a first sheet", "hard", stated[0]);
    else if (figure !== team.changes.count) fault(section, "the wrong number of changes", "hard", `${stated[0]}, not ${team.changes.count}`);
  }
  if (/\bdebut/iu.test(text) && (team.debuts ?? []).length === 0) fault(section, "a debut the brief does not give", "hard", "debut");
  if (/\bunchanged\b|\bsame (?:eleven|side|xi)\b/iu.test(text) && team.changes?.count !== 0) fault(section, "unchanged when it changed", "hard", "unchanged");
  // Dropped is a man who started last gameweek and is on the bench now; the facts say who, if anyone.
  const dropped = (team.changes?.out ?? []).some((each) => each.to === "bench") || team.benchings.some((each) => each.dropped);
  if (/\bdrop(?:s|ped|ping)?\b/iu.test(text) && !dropped) fault(section, "a man dropped the brief does not give", "hard", "dropped");
  for (const flag of team.flags) {
    if (flag.kind !== "out") continue;
    const name = printName(flag.man.player);
    for (const sentence of sentences(text).filter((each) => each.includes(name))) {
      if (!OUT_WORDS.test(sentence) || SOFT_WORDS.test(sentence)) fault(section, "an absence understated", "send-back", sentence);
    }
  }
}

/** Every figure a paragraph may state, off the facts: the side's counts, its shape, and each man's
 *  goals, assists and clean sheets. */
function figures(tie: TieFacts): number[] {
  const side = (team: TeamFacts) => [
    team.sheet.starters.length, team.sheet.bench.length, team.changes?.count ?? 0, team.changes?.in.length ?? 0,
    team.changes?.out.length ?? 0, team.debuts?.length ?? 0, team.benchings.length, team.flags.length,
    ...(team.formation ?? "").split("-").map(Number).filter(Number.isFinite),
    ...team.form.flatMap((form) => [form.goals, form.assists, form.cleanSheets, form.gameweeks]),
    ...team.benchings.flatMap((each) => [each.goals, each.assists, each.cleanSheets, each.last.goals, each.last.assists]),
  ];
  const meets = tie.meets.flatMap((meet) => (meet.kind === "facing" ? [meet.attackers.length, meet.defenders.length] : [meet.home.length, meet.away.length]));
  return [...side(tie.home), ...side(tie.away), ...meets];
}
