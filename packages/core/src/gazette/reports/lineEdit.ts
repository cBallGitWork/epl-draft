import { banned } from "../banned";
import { numbersIn, sentences } from "../predictions/prose";
import type { ReportPiece, ReportsDraft } from "./draft";
import { AMERICAN_IZE, SHEETS_AMERICAN } from "../sheets/words";
import { REPORT_NEVER } from "./style";
import { REPORT_AMERICAN } from "./words";

const NEVER = [...REPORT_NEVER, ...SHEETS_AMERICAN, ...REPORT_AMERICAN];
const broken = (text: string) => [...banned(text, NEVER), ...(text.match(AMERICAN_IZE) ?? [])];

// The sub-editor's last pass: a sentence that still carries a banned phrase after the rewrite goes back ALONE with the words it
// broke, and a fix is kept only when it clears the words and states the same figures. Cheaper and surer than a third draft.

export interface LineFix {
  code: number;
  sentence: string;
  words: string[];
}

const parts = (piece: ReportPiece) => [piece.standfirst, piece.account, ...piece.sections.flatMap((s) => [s.pitch, s.stake])];

/** Every sentence of the kept pieces still breaking the word lists, with the words it breaks. */
export function faultySentences(draft: ReportsDraft, names: readonly string[]): LineFix[] {
  const blank = (text: string) => names.reduce((out, name) => out.split(name).join("X"), text);
  return [...draft.matches].flatMap(([code, piece]) =>
    parts(piece).flatMap(sentences).flatMap((sentence) => {
      const words = broken(blank(sentence));
      return words.length === 0 ? [] : [{ code, sentence, words }];
    }),
  );
}

const same = (a: string, b: string) => numbersIn(a).sort().join() === numbersIn(b).sort().join();

/** The draft with each accepted fix in place; a fix that still breaks a word or changes a figure is refused. */
export function applyFixes(draft: ReportsDraft, fixes: readonly LineFix[], rewritten: readonly string[]): ReportsDraft {
  const swap = new Map<string, string>();
  fixes.forEach((fix, i) => {
    const next = rewritten[i]?.trim() ?? "";
    if (next !== "" && broken(next).length === 0 && same(fix.sentence, next)) swap.set(fix.sentence, next);
  });
  const fix = (text: string) => [...swap].reduce((out, [from, to]) => out.split(from).join(to), text);
  const matches = new Map(
    [...draft.matches].map(([code, piece]) => [
      code,
      { standfirst: fix(piece.standfirst), account: fix(piece.account), sections: piece.sections.map((s) => ({ head: s.head, pitch: fix(s.pitch), stake: fix(s.stake) })) },
    ]),
  );
  return { ...draft, matches };
}
