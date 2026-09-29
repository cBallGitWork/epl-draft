// How an absence and a count are printed, in both registers and in the paper's briefs.

/** Absence, never a nought: a nought is a claim (DESIGN §7). */
export const DASH = "—";

/** A count the British way: `1,234`. */
/** "A", "A and B", "A, B and C": a list as a sentence says it, with "or" where it offers a choice. */
export function listed(list: readonly string[], word: "and" | "or" = "and"): string {
  return list.length <= 1 ? (list[0] ?? "") : `${list.slice(0, -1).join(", ")} ${word} ${list.at(-1)}`;
}

export function thousands(n: number): string {
  return n.toLocaleString("en-GB");
}
