import { americanisms, banned } from "../banned";
import { numbersIn, sentences } from "../predictions/prose";
import { blanked } from "../proofing";
import type { DraftPiece } from "./writing";

// The sub-editor's last pass on a draft report: each sentence still carrying a phrase the paper does not print goes back
// alone, and a rewrite is kept only if it loses the phrase and keeps every figure. Pure; the call is the writer's.

interface SentenceFix {
  matchup: number;
  sentence: string;
  words: string[];
}

/** The phrases on `never` a sentence uses, then its American -ize: no list can name every one. Its men and sides are
 *  blanked first: Archie Gray is no American spelling. */
function broken(text: string, never: readonly string[], names: readonly string[]): string[] {
  const blank = blanked(text, names);
  return [...banned(blank, never), ...americanisms(blank, [])];
}

/** Every sentence of the writing that still uses a phrase on `never` or an -ize, `names` read as names. */
export function faultySentences(pieces: ReadonlyMap<number, DraftPiece>, never: readonly string[], names: readonly string[] = []): SentenceFix[] {
  return [...pieces].flatMap(([matchup, piece]) =>
    piece.paragraphs.flatMap(sentences).flatMap((sentence) => {
      const words = broken(sentence, never, names);
      return words.length === 0 ? [] : [{ matchup, sentence, words }];
    }),
  );
}

/** The writing with each rewrite in place of its sentence, where the rewrite is clean and changes no figure. */
export function applyFixes(pieces: ReadonlyMap<number, DraftPiece>, fixes: readonly SentenceFix[], rewritten: readonly string[], never: readonly string[], names: readonly string[] = []): Map<number, DraftPiece> {
  const out = new Map([...pieces].map(([n, p]) => [n, { paragraphs: [...p.paragraphs] }]));
  fixes.forEach((fix, i) => {
    const line = rewritten[i]?.trim() ?? "";
    const figures = (text: string) => numbersIn(text).sort().join(",");
    if (line === "" || broken(line, never, names).length > 0 || figures(line) !== figures(fix.sentence)) return;
    const piece = out.get(fix.matchup);
    if (piece !== undefined) piece.paragraphs = piece.paragraphs.map((p) => p.replace(fix.sentence, line));
  });
  return out;
}
