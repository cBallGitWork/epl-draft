import { sumOf } from "./sum";

// The average of a run of figures: a rating, a week's points, a back line's ease.

/** The mean, or null for no figures: a nought would be a reading nobody took. */
export function mean(values: readonly number[]): number | null {
  return values.length === 0 ? null : sumOf(values, (value) => value) / values.length;
}
