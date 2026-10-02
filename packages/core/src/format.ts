// How an absence, a count and a figure are printed, in both registers and in the paper's briefs.

/** Absence, never a nought: a nought is a claim (DESIGN §7). */
export const DASH = "—";

/** The noun for a count: `plural(1, "goal")` is "goal", `plural(2, "goal")` "goals". */
export function plural(n: number, word: string, many = `${word}s`): string {
  return n === 1 ? word : many;
}

/** "A", "A and B", "A, B and C": a list as a sentence says it, with "or" where it offers a choice. */
export function listed(list: readonly string[], word: "and" | "or" = "and"): string {
  return list.length <= 1 ? (list[0] ?? "") : `${list.slice(0, -1).join(", ")} ${word} ${list.at(-1)}`;
}

/** A count the British way: `1,234`. */
export function thousands(n: number): string {
  return n.toLocaleString("en-GB");
}

/** The places each kind of figure prints at whatever its value, so a column reads at one precision. */
export const PLACES = { count: 0, expected: 2, perGame: 2, perNinety: 2, rating: 1, projected: 1 } as const;

export type FigureKind = keyof typeof PLACES;

/** A figure at its kind's places, the British way: `1,234`, `3.80`, `7.0`. */
export function fixed(value: number, kind: FigureKind): string {
  const places = PLACES[kind];
  return value.toLocaleString("en-GB", { minimumFractionDigits: places, maximumFractionDigits: places });
}
