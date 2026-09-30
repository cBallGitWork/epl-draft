import type { RosterLimits } from "./types";

/** A count of starters per position letter, e.g. `{ G: 1, D: 4, M: 4, F: 2 }`. */
export type Formation = Record<string, number>;

/** Every shape the league lets a side take the field in: each position between its minimum and
 *  maximum, summing to the active total. Empty unless the total and every position's minimum are
 *  on record, because a floor we have not read is not a floor of nought. */
export function formations(limits: RosterLimits): Formation[] {
  const total = limits.maxActivePlayers;
  const positions = Object.keys(limits.maxActiveByPosition).sort();
  if (total === null || positions.length === 0) return [];
  if (positions.some((position) => limits.minActiveByPosition[position] === undefined)) return [];

  const shapes: Formation[] = [];
  const walk = (at: number, taken: Formation, used: number) => {
    if (at === positions.length) {
      if (used === total) shapes.push({ ...taken });
      return;
    }
    const position = positions[at];
    for (let count = limits.minActiveByPosition[position]; count <= limits.maxActiveByPosition[position]; count += 1) {
      if (used + count > total) break;
      walk(at + 1, { ...taken, [position]: count }, used + count);
    }
  };
  walk(0, {}, 0);
  return shapes;
}
