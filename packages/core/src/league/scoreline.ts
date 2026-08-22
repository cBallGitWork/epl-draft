// Comparing two fantasy totals when either of them may be missing.
//
// One rule, and it was written out five times: four screens computed "is this
// side behind" and the schedule's tie row computed the same thing inverted as
// "did this side win". Each carried its own copy of the reason, which is the
// tell — a rule that needs explaining at every site is a rule that belongs in
// one place (CODE_RULES §1).
//
// **The rule is that absence is not a low score.** Fantrax has no total for a
// team it has not scored yet, and the boards print a dash for it. A dash is not
// nought: dimming it as "behind" says its manager is losing, and marking the
// other side a winner says the match is decided. Neither is true — we simply do
// not have the number.

/** Whether `points` is ahead of `other`. False whenever either is missing: a
 *  number beating a dash has beaten nothing. */
export function leads(points: number | null, other: number | null): boolean {
  return points !== null && other !== null && points > other;
}

/** Whether `points` is behind `other`. Not the negation of `leads` — a draw is
 *  neither, and two dashes are neither. */
export function trails(points: number | null, other: number | null): boolean {
  return points !== null && other !== null && points < other;
}
