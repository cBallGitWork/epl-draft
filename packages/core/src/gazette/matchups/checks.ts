import { DRAFT_WRITING } from "../../config";
import { banned } from "../banned";
import type { Fault, Severity } from "../predictions/checks";
import { masked, mentionAt, numbersIn, sentences, wordCount } from "../predictions/prose";
import { repeatsIn } from "../reports/repeats";
import { REPORT_AMERICAN, REPORT_FPL } from "../reports/words";
import { SHEETS_AMERICAN } from "../sheets/words";
import type { Cutoff, MatchupContext } from "./brief";
import { listFaults, menOf, type PastProse } from "./listChecks";
import { timeline } from "./timeline";
import type { DraftPiece, DraftWriting } from "./writing";
import { DRAFT_NEVER } from "./words";

// The editor reads each match-up against its own block of the brief: its men and no other match-up's, its figures, its
// scores, the league's words, and its length. Pure; the writer is sent back once on these, never on taste.

const QUOTES = /["“”«»]/u;
const SCORE = /\b(\d{1,3})-(\d{1,3})\b/gu;
/** "The eleven", "test2's eleven": a side, never the figure 11. */
const SIDE_ELEVEN = /(?:\b(?:the|their|its|his|an|a|whose|that|this|every|each)\s+|'s\s+)eleven(?:'s)?\b/giu;
/** The punctuation the voice never uses: a colon, a question, an exclamation. */
const MARKS = /[:?!]/u;
/** An FM frame is a register, never a person's feeling: a named manager given one is invented. */
const FEELING = /\b(?:manager|boss|owner)\b[^.]{0,40}\b(?:feel|feels|felt|furious|delighted|angry|pleased|worried|fuming|livid)\b/iu;

/** `past` is the words of recent reports, for the echo; `cutoff` decides whether a forecast is a fault. */
/** The figures a match-up may print: its block's, and a gap read off a printed score, the margin and each day's. */
export function allowedFigures(ctx: MatchupContext, block: string): Set<number> {
  const gaps = timeline(ctx.state).map((b) => Math.abs(b.score.home - b.score.away));
  return new Set([0, ...numbersIn(block), Math.abs(ctx.state.margin), ...gaps]);
}

export function checkDraft(writing: DraftWriting, contexts: readonly MatchupContext[], blocks: readonly string[], cutoff: Cutoff = "gameweek", past: readonly PastProse[] = []): Fault[] {
  const faults: Fault[] = [];
  const fault = (section: string, check: string, severity: Severity, evidence: string) => faults.push({ section, check, severity, evidence });
  const everyone = contexts.map((ctx) => menOf(ctx).flatMap((m) => m.names));
  // Every side named on the page, next gameweek's opponents too: "test3" is a side, not a 3.
  const sides = [...new Set(contexts.flatMap((c) => [c.state.home.side.name, c.state.away.side.name, ...[c.next.home, c.next.away].flatMap((x) => x?.name ?? [])]))];
  const pieces: { code: number; prose: string }[] = [];
  contexts.forEach((ctx, at) => {
    const n = at + 1;
    const piece: DraftPiece | undefined = writing.matchups.get(n);
    if (piece === undefined || piece.paragraphs.length === 0) {
      fault(`${n}:matchup`, "missing", "hard", "no paragraphs");
      return;
    }
    const prose = piece.paragraphs.join("\n");
    pieces.push({ code: n, prose });
    const block = blocks[at] ?? "";
    const mine = new Set(everyone[at]);
    for (const other of everyone.flatMap((names, i) => (i === at ? [] : names))) {
      if (!mine.has(other) && other.length > 3 && mentionAt(prose, other) >= 0) fault(`${n}:matchup`, "a man from another match-up", "hard", other);
    }
    const allowed = allowedFigures(ctx, block);
    for (const x of numbersIn(prose.replace(SCORE, " ").replace(SIDE_ELEVEN, " "))) if (!allowed.has(x)) fault(`${n}:matchup`, "a figure the brief does not give", "hard", String(x));
    // A stage's own score is given too, as its two sides' points.
    const stages = timeline(ctx.state).flatMap((b) => [`${b.points.home}-${b.points.away}`, `${b.points.away}-${b.points.home}`]);
    for (const [said, a, b] of prose.matchAll(SCORE)) if (!block.includes(said) && !block.includes(`${b}-${a}`) && !stages.includes(said)) fault(`${n}:matchup`, "a score the brief does not give", "hard", said);
    if (QUOTES.test(prose)) fault(`${n}:matchup`, "a quotation mark: the paper prints nobody's words", "hard", prose.match(QUOTES)?.[0] ?? "");
    // A man's name is never a banned word: Archie Gray is not American spelling.
    const plain = masked(prose, [...everyone.flat(), ctx.state.home.side.name, ctx.state.away.side.name]).replace(/\u0000/gu, " ");
    for (const phrase of banned(plain, REPORT_FPL)) fault(`${n}:matchup`, "names a source", "hard", phrase);
    for (const phrase of banned(plain, DRAFT_NEVER)) fault(`${n}:matchup`, "a phrase this paper does not print", "send-back", phrase);
    for (const phrase of banned(plain, [...REPORT_AMERICAN, ...SHEETS_AMERICAN])) fault(`${n}:matchup`, "American, not British", "send-back", phrase);
    if (MARKS.test(prose)) fault(`${n}:matchup`, "a colon, a question or an exclamation mark", "send-back", prose.match(MARKS)?.[0] ?? "");
    if (FEELING.test(prose)) fault(`${n}:matchup`, "a named person's feeling", "send-back", prose.match(FEELING)?.[0] ?? "");
    // The score prints above the lede, so the lede never gives it again.
    if (sentences(prose)[0]?.includes(ctx.state.score) === true) fault(`${n}:matchup`, "opens on the result the page already prints", "send-back", sentences(prose)[0] ?? "");
    faults.push(...listFaults(piece, ctx, at, cutoff, block, past, sides));
    const [least, rest] = DRAFT_WRITING.matchupWords;
    const most = at === 0 ? DRAFT_WRITING.leadWords : rest;
    const words = wordCount(prose);
    if (words < least || words > most) fault(`${n}:matchup`, `a match-up of ${least} to ${most} words`, "send-back", `${words} words`);
  });
  // A side's name is no more a leaned-on word than a man's is.
  for (const r of repeatsIn(pieces, [...everyone.flat(), ...sides])) {
    const what = r.kind === "phrase" ? "a phrase said twice" : r.kind === "opener" ? "sentences that open the same way" : "a word leaned on";
    fault(r.code === null ? "page" : `${r.code}:matchup`, what, "send-back", `${r.said} ×${r.count}`);
  }
  return faults;
}
