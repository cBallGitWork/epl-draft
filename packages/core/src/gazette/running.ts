import type { Assignment } from "./newsdesk";

// How many of a firing's assignments actually get a turn.
//
// **The cap counts stories FILED, not assignments considered.** That sounds
// like a distinction without a difference and it is the whole of a bug that
// silenced the paper for a period.
//
// The writer used to slice the newsdesk's running order to the cap before
// asking any desk for a brief. A desk may refuse — the facts moved, or the
// kind has no desk yet — and a refusal spends no covered-key, so a refusing
// kind is still at the top of the order on the next firing, and the one after
// that. On 2 Sep 2026 two of them (`eleven` and `dodgers`, both gating on a
// flag that cannot be true after a round finishes) took both places in every
// firing, and the four match reports, the presser and the studio queued behind
// them were unreachable for the rest of the period. The paper reported
// "nothing to file" while holding a dozen assignments it could have written.
//
// This is the rule as a pure function so it can be tested without a model, a
// clock or a network: `take` decides whether the writer has room for one more
// attempt, and the caller counts only what it actually filed.

/** Whether a firing with `filed` stories already written may attempt another.
 *
 *  The guard is `filed`, never the loop index: an assignment that refuses costs
 *  nothing and the next one gets the turn. */
export function hasRoom(filed: number, cap: number): boolean {
  return filed < cap;
}

/** The assignments a firing would ATTEMPT, given which of them refuse.
 *
 *  Exported for the test and for nothing else — the writer runs the same rule
 *  inline because it must interleave real model calls with it. `refuses` stands
 *  in for `prepare()` returning null. */
export function attempted(
  order: readonly Assignment[],
  cap: number,
  refuses: (assignment: Assignment) => boolean,
): Assignment[] {
  const out: Assignment[] = [];
  let filed = 0;
  for (const assignment of order) {
    if (!hasRoom(filed, cap)) break;
    if (refuses(assignment)) continue;
    out.push(assignment);
    filed += 1;
  }
  return out;
}
