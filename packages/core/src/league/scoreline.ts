// Comparing two fantasy totals when either may be missing: absence is not a low score, so a dash neither leads nor trails.

/** Whether `points` is ahead of `other`; false whenever either is missing. */
export function leads(points: number | null, other: number | null): boolean {
  return points !== null && other !== null && points > other;
}

/** Whether `points` is behind `other`; not the negation of `leads`, since a draw or a dash is neither. */
export function trails(points: number | null, other: number | null): boolean {
  return points !== null && other !== null && points < other;
}
