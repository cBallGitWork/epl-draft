// What the editor reads prose with: its sentences, the figures it states, and the phrases it
// repeats. Plain text in, plain data out.

/** Sentences, split after a full stop, question mark or exclamation mark and a space, so a
 *  decimal and "B.Fernandes" survive whole. */
export function sentences(text: string): string[] {
  return text
    .split(/(?<=[.?!])\s+/u)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence !== "");
}

export function wordCount(text: string): number {
  return text.split(/\s+/u).filter((word) => /[\p{L}\p{N}]/u.test(word)).length;
}

const UNITS: Record<string, number> = {
  nought: 0, zero: 0, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18,
  nineteen: 19, third: 3, fourth: 4, fifth: 5, sixth: 6, seventh: 7, eighth: 8, ninth: 9, tenth: 10,
};
const TENS: Record<string, number> = { twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90 };

/** Every figure the text states: digits (with their commas), and number words from two upward.
 *  "one", "a", "first" and "second" are idiom far more often than they are figures. */
export function numbersIn(text: string): number[] {
  const out: number[] = [];
  for (const match of text.matchAll(/\d[\d,]*(?:\.\d+)?/gu)) {
    const value = Number(match[0].replace(/,/g, ""));
    if (Number.isFinite(value)) out.push(value);
  }
  for (const match of text.toLowerCase().matchAll(/\b(twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety)(?:[- ](one|two|three|four|five|six|seven|eight|nine))?\b|\b([a-z]+)\b/gu)) {
    if (match[1] !== undefined) {
      const unit = match[2] === undefined ? 0 : match[2] === "one" ? 1 : UNITS[match[2]];
      out.push(TENS[match[1]] + unit);
    } else if (match[3] !== undefined && match[3] in UNITS) {
      out.push(UNITS[match[3]]);
    } else if (match[3] === "hundred") {
      out.push(100);
    }
  }
  return out;
}

/** The text with every given name blanked, longest first, so "Hammer Time" is not a hype word
 *  and a long team name is not a repeated phrase. */
/** Where a name first stands whole in the text, never inside a longer one ("Hall" in
 *  "Dewsbury-Hall", "Fernandes" in "B.Fernandes"); -1 when it does not. */
export function mentionAt(text: string, name: string): number {
  if (name === "") return -1;
  for (let at = text.indexOf(name); at !== -1; at = text.indexOf(name, at + 1)) {
    if (!/[\p{L}.-]/u.test(text[at - 1] ?? "") && !/[\p{L}-]/u.test(text[at + name.length] ?? "")) return at;
  }
  return -1;
}

export function masked(text: string, names: readonly string[]): string {
  return [...names]
    .filter((name) => name.trim() !== "")
    .sort((a, b) => b.length - a.length)
    .reduce((out, name) => out.split(name).join("\u0000"), text);
}

/** Lower-cased word runs of length `n`, never across a blanked name. */
export function ngrams(text: string, n: number, names: readonly string[]): Set<string> {
  const out = new Set<string>();
  for (const segment of masked(text, names).split(/\u0000|[.?!]/u)) {
    const words = segment.toLowerCase().match(/[\p{L}\p{N}'’]+/gu) ?? [];
    for (let at = 0; at + n <= words.length; at += 1) out.add(words.slice(at, at + n).join(" "));
  }
  return out;
}
