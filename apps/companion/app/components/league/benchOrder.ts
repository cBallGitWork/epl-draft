// The order the bench comes on in: Fantrax's own ranks to start, then the manager's swaps.

/** The bench's order from Fantrax's `autoSubOrderMap` (1 first; 0 means unranked), unranked men after in their standing order. */
export function benchFrom(ranks: Readonly<Record<string, number>>, bench: readonly string[]): string[] {
  const ranked = bench.filter((id) => (ranks[id] ?? 0) > 0).sort((a, b) => (ranks[a] ?? 0) - (ranks[b] ?? 0));
  return [...ranked, ...bench.filter((id) => !ranked.includes(id))];
}

/** `bench` in `order`'s order: men no longer on it drop out, men new to it go last. */
export function orderBench(order: readonly string[], bench: readonly string[]): string[] {
  return [...order.filter((id) => bench.includes(id)), ...bench.filter((id) => !order.includes(id))];
}

/** Two men's places in the order, swapped. */
export function swapInOrder(order: readonly string[], a: string, b: string): string[] {
  const i = order.indexOf(a);
  const j = order.indexOf(b);
  if (i < 0 || j < 0) return [...order];
  const next = [...order];
  [next[i], next[j]] = [b, a];
  return next;
}
