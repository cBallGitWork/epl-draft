import { howMany } from "../format";

// A count and its noun as a brief says it, nothing at nought: the house's howMany with the nought left out.

/** "a goal", "2 goals"; null at nought, and null where the read did not carry the count. */
export const aCount = (n: number | null, one: string, many: string): string | null => (n === null || n === 0 ? null : n === 1 ? one : `${n} ${many}`);

/** "2 goals, 1 assist": each count with its noun, a nought left out; empty when every count is nought. */
export const tally = (counts: readonly (readonly [n: number, word: string])[]): string =>
  counts.filter(([n]) => n > 0).map(([n, word]) => howMany(n, word)).join(", ");
