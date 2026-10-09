// Adding up a run of rows by one figure each: a man's matches, a squad's points, a week's parts.

/** The total of `of` over every item; nought for none, since a sum of nothing is nought. */
export function sumOf<T>(items: readonly T[], of: (item: T) => number): number {
  return items.reduce((total, item) => total + of(item), 0);
}
