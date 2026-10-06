import { masked, sentences } from "../predictions/prose";

// The sub-editor's ear for repetition: a phrase said twice in one match, a word leaned on across a match or the page,
// and sentences that open the same way.

export interface Repeat {
  /** The match it is in, or null when it is across the page. */
  code: number | null;
  kind: "phrase" | "word" | "opener";
  said: string;
  count: number;
  /** The sentences after the first that carry it: the ones to rewrite. */
  later: string[];
}

/** Words too small to make a phrase, and the football nouns a report cannot do without. */
const SMALL = new Set([
  "a", "an", "the", "and", "or", "but", "of", "to", "in", "on", "at", "for", "from", "by", "with", "as", "his", "her", "their", "its",
  "he", "she", "it", "they", "him", "them", "was", "were", "is", "are", "had", "has", "have", "be", "been", "that", "this", "which",
  "who", "after", "before", "into", "than", "then", "so", "not", "no", "one", "two", "three", "four", "five", "all", "only",
]);
const NEEDED = new Set(["goal", "goals", "minute", "minutes", "half", "time", "point", "points", "season", "league", "match", "side", "added"]);
const PHRASE = 3;
const WORD_IN_MATCH = 2;
const WORD_ON_PAGE = 4;

const words = (text: string) => text.toLowerCase().match(/[\p{L}'’]+/gu) ?? [];
const content = (word: string) => word.length >= 4 && !SMALL.has(word) && !NEEDED.has(word);

/** Every repeat in the pieces; `names` are blanked first, so a man's name is never a repeat. */
export function repeatsIn(pieces: readonly { code: number; prose: string }[], names: readonly string[]): Repeat[] {
  const out: Repeat[] = [];
  const page = new Map<string, { count: number; sentences: string[] }>();
  for (const piece of pieces) {
    // Split first, then blank the names in each sentence, so a repeat points at the sentence as written.
    const originals = sentences(piece.prose.replace(/\n/gu, ". "));
    const grams = new Map<string, string[]>();
    const counts = new Map<string, string[]>();
    const openers = new Map<string, string[]>();
    for (const line of originals) {
      const w = words(masked(line, names).replace(/\u0000/gu, " "));
      const seen = new Set<string>();
      for (let i = 0; i + PHRASE <= w.length; i++) {
        const gram = w.slice(i, i + PHRASE);
        const key = gram.join(" ");
        if (gram.some((word) => !SMALL.has(word) && !NEEDED.has(word)) && !seen.has(key)) grams.set(key, [...(grams.get(key) ?? []), line]);
        seen.add(key);
      }
      for (const word of new Set(w.filter(content))) {
        counts.set(word, [...(counts.get(word) ?? []), line]);
        const all = page.get(word) ?? { count: 0, sentences: [] };
        page.set(word, { count: all.count + w.filter((x) => x === word).length, sentences: [...all.sentences, line] });
      }
      const opener = w.slice(0, 2).join(" ");
      if (w.length >= 2) openers.set(opener, [...(openers.get(opener) ?? []), line]);
    }
    for (const [said, where] of grams) if (where.length >= 2) out.push({ code: piece.code, kind: "phrase", said, count: where.length, later: where.slice(1) });
    for (const [said, where] of counts) if (where.length > WORD_IN_MATCH) out.push({ code: piece.code, kind: "word", said, count: where.length, later: where.slice(WORD_IN_MATCH) });
    for (const [said, where] of openers) if (where.length >= 2) out.push({ code: piece.code, kind: "opener", said, count: where.length, later: where.slice(1) });
  }
  for (const [said, { count, sentences: where }] of page) if (count > WORD_ON_PAGE) out.push({ code: null, kind: "word", said, count, later: where.slice(WORD_ON_PAGE) });
  // A phrase inside a longer repeated phrase is the same repeat, named once.
  return out.filter((r) => r.kind !== "phrase" || !out.some((o) => o !== r && o.kind === "phrase" && o.code === r.code && o.said.includes(r.said) && o.said.length > r.said.length));
}
