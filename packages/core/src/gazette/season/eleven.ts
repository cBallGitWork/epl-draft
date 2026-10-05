import type { Formation } from "../../league/formations";

// The best eleven a squad can field in a shape the league allows (`formations`), every man at any slot he is
// eligible for. Exact, not greedy. Pure.

/** One man's expected points at each slot he may fill; a slot he is not eligible for is absent. */
export interface ElevenMan {
  id: string;
  slots: Readonly<Record<string, number>>;
}

export interface Eleven {
  total: number;
  picks: { id: string; slot: string }[];
}

/** Null when no allowed shape can be filled from the squad. */
export function bestEleven(men: readonly ElevenMan[], shapes: readonly Formation[]): Eleven | null {
  const positions = [...new Set(shapes.flatMap((shape) => Object.keys(shape)))].sort();
  const most = Object.fromEntries(positions.map((position) => [position, Math.max(...shapes.map((shape) => shape[position] ?? 0))]));
  const radix = positions.map((position) => most[position] + 1);
  const size = radix.reduce((product, count) => product * count, 1);
  const stride = radix.map((_, at) => radix.slice(0, at).reduce((product, count) => product * count, 1));
  const countAt = (state: number, at: number) => Math.floor(state / stride[at]) % radix[at];

  // best[state] after each man; from[man][state] is the state before him and the slot he took, or -1 to skip.
  let best = new Float64Array(size).fill(Number.NEGATIVE_INFINITY);
  best[0] = 0;
  const from: { state: Int32Array; slot: Int8Array }[] = [];
  for (const man of men) {
    const next = Float64Array.from(best);
    const state = new Int32Array(size).map((_, at) => at);
    const slot = new Int8Array(size).fill(-1);
    for (let at = 0; at < size; at += 1) {
      if (best[at] === Number.NEGATIVE_INFINITY) continue;
      positions.forEach((position, index) => {
        const points = man.slots[position];
        if (points === undefined || countAt(at, index) >= most[position]) return;
        const to = at + stride[index];
        if (best[at] + points > next[to]) {
          next[to] = best[at] + points;
          state[to] = at;
          slot[to] = index;
        }
      });
    }
    from.push({ state, slot });
    best = next;
  }

  let end = -1;
  for (const shape of shapes) {
    const at = positions.reduce((state, position, index) => state + (shape[position] ?? 0) * stride[index], 0);
    if (best[at] !== Number.NEGATIVE_INFINITY && (end === -1 || best[at] > best[end])) end = at;
  }
  if (end === -1) return null;

  const picks: Eleven["picks"] = [];
  for (let man = men.length - 1, at = end; man >= 0; man -= 1) {
    const step = from[man];
    if (step.slot[at] !== -1) picks.unshift({ id: men[man].id, slot: positions[step.slot[at]] });
    at = step.state[at];
  }
  return { total: best[end], picks };
}
