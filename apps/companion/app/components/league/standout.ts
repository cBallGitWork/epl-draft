// Which figures on a board are lit, and the ink they are lit in (DESIGN §3): orange for a column's best,
// yellow for the rest of its standouts, red where the top of the column is the bad end. Never a ground.

/** A column's two cuts: yellow from `good`, orange from `best`. */
export interface StandoutCut {
  good: number | null;
  best: number | null;
}

/** How much of a column each ink may take. */
export interface StandoutShares {
  good: number;
  best: number;
}

/** Who a share is OF, and how thin a column may be before nothing in it is exceptional. */
interface Population {
  /** Defaults to the figures above nought: a column of 490 noughts is not 490 men competing. */
  of?: number;
  /** Fewer scored figures than this lights nothing. */
  floor?: number;
}

/** A side-sized board: a fifth in yellow, so three scorers of sixteen stand out, and a tenth in orange, its one best man. */
export const SIDE_SHARES: StandoutShares = { good: 1 / 5, best: 1 / 10 };

/** The figure a column's standouts reach: its top values, whole values at a time, while they fit inside
 *  `share`. Null when the column is thin or its top value is common. */
export function standoutCut(
  values: Iterable<number | null>,
  share: number,
  { of, floor = 0 }: Population = {},
): number | null {
  const scored = [...values]
    .filter((value): value is number => value !== null && Number.isFinite(value) && value > 0)
    .sort((a, b) => b - a);
  if (scored.length === 0 || scored.length < floor) return null;
  const room = (of ?? scored.length) * share;
  let cut: number | null = null;
  for (let at = 0; at < scored.length; at += 1) {
    if (at < scored.length - 1 && scored[at + 1] === scored[at]) continue;
    if (at + 1 > room) break;
    cut = scored[at];
  }
  return cut;
}

/** Both of a column's cuts at once. */
export function standoutCuts(
  values: readonly (number | null)[],
  shares: StandoutShares,
  population: Population = {},
): StandoutCut {
  return { good: standoutCut(values, shares.good, population), best: standoutCut(values, shares.best, population) };
}

/** The classes a figure wears: a lit class for the instruments, a weight, and the ink. Empty when unlit. */
export function standoutInk(value: number, cut: StandoutCut | undefined, rank: "high" | "low"): string {
  if (cut?.good == null || value < cut.good) return "";
  if (rank === "low") return "cm-lit-bad font-bold text-bad";
  return cut.best !== null && value >= cut.best
    ? "cm-lit-best font-bold text-peak"
    : "cm-lit-good font-bold text-accent";
}
