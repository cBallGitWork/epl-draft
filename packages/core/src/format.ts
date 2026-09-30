// How an absence and a count are printed, in both registers and in the paper's briefs.

/** Absence, never a nought: a nought is a claim (DESIGN §7). */
export const DASH = "—";

/** The noun for a count: `plural(1, "goal")` is "goal", `plural(2, "goal")` "goals". */
export function plural(n: number, word: string, many = `${word}s`): string {
  return n === 1 ? word : many;
}

/** A count the British way: `1,234`. */
export function thousands(n: number): string {
  return n.toLocaleString("en-GB");
}
