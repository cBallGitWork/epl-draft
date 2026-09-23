// How an absence and a count are printed, in both registers and in the paper's briefs.

/** Absence, never a nought: a nought is a claim (DESIGN §7). */
export const DASH = "—";

/** A count the British way: `1,234`. */
export function thousands(n: number): string {
  return n.toLocaleString("en-GB");
}
