// `4` becomes `+4`, and `-2` stays `-2`.
//
// A figure that can go either way needs its sign shown when it is positive,
// because the minus is already there when it is negative and a bare `4` beside
// a `-2` reads as a different kind of number rather than the other direction of
// the same one. Goal difference, a pedigree against the pick, a scoring
// category's contribution — all of them.
//
// It had reached five copies — the league table (`tables.ts`), the pool board,
// a player's pedigree, his points breakdown and the live card — written three
// different ways: a template string, a bare `"+"` printed beside the number,
// and a ternary returning the number itself. Three is the rule (§1).
//
// **The sign only, never the colour.** The five call sites deliberately disagree
// about what a positive figure MEANS: a pedigree is three-way (bad, good, and
// exactly-at-cost in plain ink), the breakdown and the live card are two-way,
// and the pool's trend colours a rise and a fall differently again. Folding the
// colour in would make one screen's reading the rule for all of them, which is
// the DASH lesson — a shared thing that most call sites then have to override.

/** "+4", "-2", "0".
 *
 *  Nought carries no sign: it is neither direction, and `+0` reads as a claim
 *  that something went up. */
export function signed(value: number): string {
  return value > 0 ? `+${value}` : String(value);
}
