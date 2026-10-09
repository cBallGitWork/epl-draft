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

/** How long the text runs, as a length fault quotes it: "3 sentences, 41 words". */
export function lengthOf(text: string): string {
  return `${sentences(text).length} sentences, ${wordCount(text)} words`;
}

const UNITS: Record<string, number> = {
  nought: 0, zero: 0, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18,
  nineteen: 19, third: 3, fourth: 4, fifth: 5, sixth: 6, seventh: 7, eighth: 8, ninth: 9, tenth: 10,
};
const TENS: Record<string, number> = { twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90 };
const SCALES: Record<string, number> = { hundred: 100, thousand: 1000 };
/** A number in words: tens and a digit, a unit, or a bare "hundred", each times any hundred or thousand after it. */
const IN_WORDS = new RegExp(
  String.raw`\b(?:(${Object.keys(TENS).join("|")})(?:[- ](one|two|three|four|five|six|seven|eight|nine))?|(${Object.keys(UNITS).join("|")})|(hundred))((?:[- ](?:hundred|thousand))*)\b`,
  "gu",
);

/** Every figure the text states: digits (with their commas), and number words from two upward, "eight thousand"
 *  whole. "one", "a", "first", "second" and a bare "thousand" are idiom far more often than they are figures. */
export function numbersIn(text: string): number[] {
  const out: number[] = [];
  for (const match of text.matchAll(/\d[\d,]*(?:\.\d+)?/gu)) {
    const value = Number(match[0].replace(/,/g, ""));
    if (Number.isFinite(value)) out.push(value);
  }
  for (const [, tens, digit, unit, hundred, scales] of text.toLowerCase().matchAll(IN_WORDS)) {
    const base = tens !== undefined ? TENS[tens] + (digit === undefined ? 0 : digit === "one" ? 1 : UNITS[digit]) : unit !== undefined ? UNITS[unit] : SCALES[hundred];
    out.push((scales.match(/[a-z]+/gu) ?? []).reduce((value, scale) => value * SCALES[scale], base));
  }
  return out;
}

/** Where a name first stands whole in the text, never inside a longer one ("Hall" in
 *  "Dewsbury-Hall", "Fernandes" in "B.Fernandes"); -1 when it does not. */
export function mentionAt(text: string, name: string): number {
  if (name === "") return -1;
  for (let at = text.indexOf(name); at !== -1; at = text.indexOf(name, at + 1)) {
    if (!/[\p{L}.-]/u.test(text[at - 1] ?? "") && !/[\p{L}-]/u.test(text[at + name.length] ?? "")) return at;
  }
  return -1;
}

/** The text with every given name blanked, longest first, so "Hammer Time" is not a hype word
 *  and a long team name is not a repeated phrase. */
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
