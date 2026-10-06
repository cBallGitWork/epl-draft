// Gathering items into lists by a key.

/** Items in lists by `keyOf`: the keys, and each list, in the order first met. */
export function groupedBy<T, K>(items: Iterable<T>, keyOf: (item: T) => K): Map<K, T[]> {
  const groups = new Map<K, T[]>();
  for (const item of items) {
    const key = keyOf(item);
    const group = groups.get(key);
    if (group) group.push(item);
    else groups.set(key, [item]);
  }
  return groups;
}
