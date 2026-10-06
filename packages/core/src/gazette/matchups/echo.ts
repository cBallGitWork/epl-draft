// Nothing told the same way twice running: a headline that turns on a word a recent one did.

const COMMON = new Set(["the", "and", "for", "with", "from", "into", "over", "that", "this", "their", "them", "they", "have", "when", "after", "gets", "goes"]);
const words = (text: string) => new Set((text.toLowerCase().match(/[\p{L}\p{N}'’]+/gu) ?? []).filter((w) => w.length >= 4 && !COMMON.has(w)));

/** The word a headline shares with one filed before, or null. */
export function headlineEcho(headline: string, past: readonly string[]): string | null {
  const mine = words(headline);
  for (const p of past) for (const w of words(p)) if (mine.has(w)) return w;
  return null;
}
