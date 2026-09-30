import { DRAFT_WRITING } from "../../config";
import { banned } from "../banned";
import type { Fault, Severity } from "../predictions/checks";
import { mentionAt, numbersIn, sentences, wordCount } from "../predictions/prose";
import { repeatsIn } from "../reports/repeats";
import { REPORT_AMERICAN, REPORT_FPL } from "../reports/words";
import { SHEETS_AMERICAN } from "../sheets/words";
import type { MatchupContext } from "./brief";
import type { DraftPiece, DraftWriting } from "./writing";
import { DRAFT_NEVER } from "./words";

// The editor reads each match-up against its own block of the brief: its men and no other match-up's, its figures, its
// scores, the league's words, and its length. Pure; the writer is sent back once on these, never on taste.

const QUOTES = /["“”«»]/u;
const SCORE = /\b(\d{1,3})-(\d{1,3})\b/gu;
/** "The eleven", "test2's eleven": a side, never the figure 11. */
const SIDE_ELEVEN = /(?:\b(?:the|their|its|his|an|a|whose|that|this|every|each)\s+|'s\s+)eleven(?:'s)?\b/giu;
/** An FM frame is a register, never a person's feeling: a named manager given one is invented. */
const FEELING = /\b(?:manager|boss|owner)\b[^.]{0,40}\b(?:feel|feels|felt|furious|delighted|angry|pleased|worried|fuming|livid)\b/iu;

/** Every man a match-up may name: its elevens and benches, surname and full. */
function menOf(ctx: MatchupContext): string[] {
  return [ctx.state.home.side, ctx.state.away.side].flatMap((s) => [...s.eleven, ...s.bench]).flatMap((m) => [m.name, m.name.split(/\s+/u).at(-1) ?? m.name]);
}

export function checkDraft(writing: DraftWriting, contexts: readonly MatchupContext[], blocks: readonly string[]): Fault[] {
  const faults: Fault[] = [];
  const fault = (section: string, check: string, severity: Severity, evidence: string) => faults.push({ section, check, severity, evidence });
  const everyone = contexts.map(menOf);
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
    const allowed = new Set([0, ...numbersIn(block)]);
    for (const x of numbersIn(prose.replace(SCORE, " ").replace(SIDE_ELEVEN, " "))) if (!allowed.has(x)) fault(`${n}:matchup`, "a figure the brief does not give", "hard", String(x));
    for (const [said, a, b] of prose.matchAll(SCORE)) if (!block.includes(said) && !block.includes(`${b}-${a}`)) fault(`${n}:matchup`, "a score the brief does not give", "hard", said);
    if (QUOTES.test(prose)) fault(`${n}:matchup`, "a quotation mark: the paper prints nobody's words", "hard", prose.match(QUOTES)?.[0] ?? "");
    for (const phrase of banned(prose, REPORT_FPL)) fault(`${n}:matchup`, "names a source", "hard", phrase);
    for (const phrase of banned(prose, DRAFT_NEVER)) fault(`${n}:matchup`, "a phrase this paper does not print", "send-back", phrase);
    for (const phrase of banned(prose, [...REPORT_AMERICAN, ...SHEETS_AMERICAN])) fault(`${n}:matchup`, "American, not British", "send-back", phrase);
    if (FEELING.test(prose)) fault(`${n}:matchup`, "a named person's feeling", "send-back", prose.match(FEELING)?.[0] ?? "");
    // The score prints above the lede, so the lede never gives it again.
    if (sentences(prose)[0]?.includes(ctx.state.score) === true) fault(`${n}:matchup`, "opens on the result the page already prints", "send-back", sentences(prose)[0] ?? "");
    const [least, rest] = DRAFT_WRITING.matchupWords;
    const most = at === 0 ? DRAFT_WRITING.leadWords : rest;
    const words = wordCount(prose);
    if (words < least || words > most) fault(`${n}:matchup`, `a match-up of ${least} to ${most} words`, "send-back", `${words} words`);
  });
  // A side's name is no more a leaned-on word than a man's is.
  const sides = contexts.flatMap((c) => [c.state.home.side.name, c.state.away.side.name]);
  for (const r of repeatsIn(pieces, [...everyone.flat(), ...sides])) {
    const what = r.kind === "phrase" ? "a phrase said twice" : r.kind === "opener" ? "sentences that open the same way" : "a word leaned on";
    fault(r.code === null ? "page" : `${r.code}:matchup`, what, "send-back", `${r.said} ×${r.count}`);
  }
  return faults;
}
