import { REPORTS } from "../../config";
import { capital, withoutAccents } from "../../format";
import { ON_THE_PITCH } from "../../football/types";
import { faultLog, type Fault, type Report } from "../predictions/checks";
import { mentionAt as mentionExact, numbersIn, sentences, wordCount } from "../predictions/prose";
import type { MatchDesk } from "./desk";
import type { ReportPiece, ReportsDraft } from "./draft";
import { surname } from "./keyStats";
import { partFaults } from "./parts";
import { repeatsIn } from "./repeats";
import { dayFaults, wordFaults } from "./style";
import { isDismissal, isGoal } from "./timeline";
import { higherFirst } from "./derived";
import { sectionKey } from "./parts";

// The editor reads every match against its own facts: names, figures, scorelines, the order of the goals, what must be
// covered and how long it runs. Pure; the writer sends back once on these and never on taste.

interface ReportsCheck {
  desks: readonly MatchDesk[];
  /** Each match's brief block, by fixture code: every figure and name it may use. */
  blocks: ReadonlyMap<number, string>;
  gameweek: number;
  /** The prose of recent report days, newest first. */
  past: readonly string[];
}

/** Where a name stands whole at or after `from`, allowing the capital a particle takes at a sentence's start ("Van Hecke"). */
function mentionAt(text: string, name: string, from = 0): number {
  const tail = text.slice(from);
  const at = [mentionExact(tail, name), mentionExact(tail, capital(name))].filter((n) => n >= 0);
  return at.length === 0 ? -1 : from + Math.min(...at);
}

const CAME_ON = /\b(?:off the bench|from the bench|as a substitute|came on|coming on|introduced)\b/iu;

/** A length is a target, not a guillotine: a little under or over is not worth a rewrite. */
const SLACK_UNDER = 0.85;
const SLACK_OVER = 1.15;

const RECORD = /\b(?:first (?:win|defeat|clean sheet|home win|away win)|unbeaten|in a row|without a win|straight (?:wins|defeats))\b/giu;
const COMEBACK = /\bcome ?back\b|\bfight ?back\b|\bfought back\b/iu;
const SCORE = /\b(\d{1,2})-(\d{1,2})\b/gu;

const proseOf = (piece: ReportPiece) => [piece.standfirst, piece.account, ...piece.sections.flatMap((s) => [s.head, s.pitch, s.stake])].join("\n");

export function checkReports(draft: ReportsDraft, ctx: ReportsCheck): Fault[] {
  const { faults, fault } = faultLog();
  const allNames = ctx.desks.flatMap(namesOf);
  // Other matches' men, never their clubs: a stake names a next opponent, and a club is no stranger to the page.
  const allMen = ctx.desks.flatMap((d) => d.match.men.map((m) => surname(m.name)));

  // The headline is struck and chosen by `headline.ts` and the fan, not sent back.
  const heads = new Map<string, number>();
  const pieces: { code: number; prose: string; account: string; standfirst: string }[] = [];
  for (const desk of ctx.desks) {
    const code = desk.match.fixture.code;
    const piece = draft.matches.get(code);
    if (piece === undefined || piece.standfirst === "" || piece.account === "") {
      fault(`${code}:match`, "missing", "hard", "no standfirst or account for this match");
      continue;
    }
    const names = namesOf(desk);
    const prose = proseOf(piece);
    pieces.push({ code, prose, account: piece.account, standfirst: piece.standfirst });
    const block = ctx.blocks.get(code) ?? "";

    // The football parts carry no draft words; a stake may, and carries no advice or forecast either way.
    wordFaults(`${code}:standfirst`, piece.standfirst, true, names, fault);
    wordFaults(`${code}:account`, piece.account, true, names, fault);
    piece.sections.forEach((s, i) => {
      wordFaults(sectionKey(code, i), `${s.head}. ${s.pitch}`, true, names, fault);
      wordFaults(sectionKey(code, i), s.stake, false, names, fault);
    });

    facts(code, prose, desk, block, ctx, allMen, names, fault);
    shape(code, piece, desk, fault);
    for (const s of piece.sections) {
      for (const word of s.head.toLowerCase().match(/\p{L}{4,}/gu) ?? []) {
        if (heads.has(word) && heads.get(word) !== code) fault(`${code}:heads`, "a word another match's head uses", "send-back", word);
        heads.set(word, code);
      }
    }
  }
  dayFaults(pieces, allNames, [...ctx.blocks.values()].join("\n"), ctx.past, REPORTS.echo, fault);
  for (const r of repeatsIn(pieces, allNames)) {
    const what = r.kind === "phrase" ? "a phrase said twice" : r.kind === "opener" ? "sentences that open the same way" : "a word leaned on";
    fault(r.code === null ? "day" : `${r.code}:match`, what, "send-back", `${r.said} ×${r.count}`);
  }
  return faults;
}

/** Every name this match may print: its men in full and by surname, its clubs, its managers and referee. */
function namesOf(desk: MatchDesk): string[] {
  const { match } = desk;
  return [
    ...match.men.flatMap((m) => [m.name, surname(m.name)]),
    ...[match.home, match.away].flatMap((c) => [c.name, ...c.shorts, c.manager].filter((n): n is string => n !== null)),
    ...(match.referee === null ? [] : [match.referee]),
  ];
}

function facts(code: number, prose: string, desk: MatchDesk, block: string, ctx: ReportsCheck, allMen: readonly string[], names: readonly string[], fault: Report): void {
  const section = `${code}:match`;
  // A man from another match in this one's prose is the confident wrong statement this paper refuses.
  const mine = new Set(names);
  // A one-name man elsewhere ("Rayan") is no stranger when he is part of a name in this match ("Rayan Cherki").
  const inMine = (other: string) => names.some((name) => name.split(/\s+/u).includes(other));
  for (const other of allMen) {
    if (!mine.has(other) && !inMine(other) && other.length > 3 && mentionAt(prose, other) >= 0) fault(section, "a man from another match", "hard", other);
  }
  // Besides the block's own figures: the goal total ("an eight-goal match"), and ten or nine men after a red card.
  const total = (desk.match.fixture.homeScore ?? 0) + (desk.match.fixture.awayScore ?? 0);
  const reds = desk.events.filter((e) => isDismissal(e.kind)).length;
  const allowed = new Set([...numbersIn(block), 0, 90, 45, ctx.gameweek, total, ...(reds > 0 ? [ON_THE_PITCH - 1, ON_THE_PITCH - reds] : [])]);
  for (const n of numbersIn(prose.replace(SCORE, " "))) if (!allowed.has(n)) fault(section, "a figure the facts do not give", "hard", String(n));

  const events = desk.events.filter(isGoal);
  const scores = new Set([
    `${desk.match.fixture.homeScore}-${desk.match.fixture.awayScore}`,
    ...(desk.match.halfTime === null ? [] : [`${desk.match.halfTime.home}-${desk.match.halfTime.away}`]),
    ...events.flatMap((e) => (e.score === null ? [] : [`${e.score.home}-${e.score.away}`])),
  ]);
  // A head-to-head score the brief hands over is the league's, not the match's, and is no invented scoreline.
  for (const [said] of block.matchAll(SCORE)) scores.add(said);
  for (const [said, a, b] of prose.matchAll(SCORE)) {
    if (!scores.has(said) && !scores.has(`${b}-${a}`)) fault(section, "a scoreline the match never had", "hard", said);
    else if (Number(a) < Number(b)) fault(section, "a score in prose goes higher first", "send-back", said);
  }
  for (const [said] of prose.matchAll(RECORD)) if (!block.toLowerCase().includes(said.toLowerCase())) fault(section, "a record the facts do not give", "send-back", said);
  if (COMEBACK.test(prose) && !desk.facts.some((f) => f.includes("came from behind"))) fault(section, "a comeback that did not finish level or ahead", "send-back", prose.match(COMEBACK)?.[0] ?? "");

  // A man is who the sheet says: a starter is never the man who came on, and a name keeps its accents.
  const starters = desk.match.men.filter((m) => m.started);
  for (const sentence of sentences(prose.replace(/\n/gu, ". "))) {
    const on = CAME_ON.exec(sentence);
    if (on === null) continue;
    // The man the phrase is about is the one named nearest before it.
    const nearest = desk.match.men
      .map((m) => ({ m, at: mentionAt(sentence.slice(0, on.index), surname(m.name)) }))
      .filter((x) => x.at >= 0)
      .sort((x, y) => y.at - x.at)[0];
    if (nearest !== undefined && starters.includes(nearest.m)) fault(section, "a starter called a substitute", "hard", sentence.slice(0, 80));
  }
  for (const man of desk.match.men) {
    const name = surname(man.name);
    if (withoutAccents(name) !== name && mentionAt(prose, withoutAccents(name)) >= 0) fault(section, "a name spelt without its accents", "send-back", withoutAccents(name));
  }

  // Everything that decided or changed the match is named somewhere in its piece.
  const musts = desk.events.filter((e) => ["goal", "penalty-goal", "own-goal", "ruled-out", "penalty-missed", "penalty-saved", "sent-off", "second-yellow", "injured-off"].includes(e.kind) || (e.kind === "substitution" && e.injury));
  const said: Record<string, RegExp> = {
    "ruled-out": /\bruled out\b|\bdisallowed\b|\bvideo review\b|\bVAR\b/u,
    "injured-off": /\binjur/u,
    substitution: /\binjur/u,
    "sent-off": /\bsent off\b|\bred card\b|\bdismissed\b/u,
    "second-yellow": /\bsent off\b|\bsecond booking\b|\bsecond yellow\b|\bdismissed\b/u,
    "penalty-goal": /\bpenalt|\bspot\b/u,
    "penalty-missed": /\bpenalt|\bspot\b/u,
    "penalty-saved": /\bpenalt|\bspot\b/u,
    "own-goal": /\bown goal\b|\bown net\b/u,
  };
  for (const e of musts) {
    const man = e.kind === "substitution" ? e.other : e.man;
    const word = said[e.kind];
    if (man !== null && (mentionAt(prose, surname(man.name)) < 0 || (word !== undefined && !word.test(prose)))) {
      fault(section, "leaves out a goal, a red, a penalty, a VAR call or an injury", "send-back", `${e.kind} ${man.name}`);
    }
  }
}

/** The standfirst, the order of the goals in the account, the heads and the length. */
function shape(code: number, piece: ReportPiece, desk: MatchDesk, fault: Report): void {
  const { match, budget } = desk;
  const sf = piece.standfirst;
  const clubNamed = (c: typeof match.home) => [c.name, ...c.shorts].some((n) => mentionAt(sf, n) >= 0);
  const [h, a] = [match.fixture.homeScore ?? 0, match.fixture.awayScore ?? 0];
  if (sentences(sf).length !== 1 || wordCount(sf) > REPORTS.standfirstWords) fault(`${code}:standfirst`, `one sentence of ${REPORTS.standfirstWords} words or fewer`, "send-back", `${sentences(sf).length} sentences, ${wordCount(sf)} words`);
  if (!clubNamed(match.home) || !clubNamed(match.away)) fault(`${code}:standfirst`, "names both clubs", "send-back", sf);
  if (!sf.includes(higherFirst(h, a))) fault(`${code}:standfirst`, "gives the score, higher first", "send-back", sf);
  if (desk.events.some((e) => e.phrases.some((p) => sf.includes(p)))) fault(`${code}:standfirst`, "a minute in the standfirst", "send-back", sf);

  const scorers = desk.events.flatMap((e) => (isGoal(e) && e.kind !== "own-goal" && e.man !== null ? [surname(e.man.name)] : []));
  // Each scorer must be named after the one before him; an earlier mention (a booking) does not count against the order.
  let last = 0;
  for (const name of scorers) {
    const after = mentionAt(piece.account, name, last);
    if (mentionAt(piece.account, name) < 0) fault(`${code}:account`, "the account leaves out a scorer", "send-back", name);
    else if (after < 0) fault(`${code}:account`, "the goals out of order", "send-back", name);
    else last = after + 1;
  }

  if (piece.sections.length === 0) fault(`${code}:match`, "no sections", "hard", "0");
  else if (piece.sections.length !== budget.sections) fault(`${code}:match`, `${budget.sections} sections, not ${piece.sections.length}`, "send-back", String(piece.sections.length));
  const mine = [...match.men.map((m) => surname(m.name)), match.home.name, match.away.name, ...match.home.shorts, ...match.away.shorts];
  piece.sections.forEach((s, i) => {
    if (wordCount(s.head) > 4 || s.head === "") fault(sectionKey(code, i), "a head of four words or fewer", "send-back", s.head);
    if (!mine.some((n) => mentionAt(s.head, n) >= 0)) fault(sectionKey(code, i), "a head names a man or club from this match", "send-back", s.head);
    if (s.pitch === "" || s.stake === "") fault(sectionKey(code, i), "a section needs its football and its stake", "hard", s.head);
  });
  const [least, most] = budget.account;
  const words = wordCount(piece.account);
  if (words < least * SLACK_UNDER || words > most * SLACK_OVER) fault(`${code}:account`, `an account of ${least} to ${most} words`, "send-back", `${words} words`);
  const [sLeast, sMost] = REPORTS.sectionWords;
  piece.sections.forEach((s, i) => {
    const n = wordCount(`${s.pitch} ${s.stake}`);
    if (n < sLeast * SLACK_UNDER || n > sMost * SLACK_OVER) fault(sectionKey(code, i), `a section of ${sLeast} to ${sMost} words`, "send-back", `${n} words`);
  });
  partFaults(code, piece, desk, fault);
}
