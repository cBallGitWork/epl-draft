// Points Fantrax has not credited yet.
//
// Their totals move during a match — verified with Craig on 13 Aug — with a
// single exception: a clean sheet is not credited until the final whistle, so a
// defender who has kept one for eighty minutes is showing nothing while FPL has
// been paying the points since the hour mark. `pendingCleanSheets` in core is
// the arithmetic; this is the one way it is ever printed.
//
// Four screens print it — the Live tab's own tie, the head-to-head board, the
// squad sheet and the lineup planner — which is the rule of 3 fired twice over.
// Before this they were four spellings of one rule: two asked
// `pending && pending.points > 0` and two asked `pending === null`, which is two
// chances for a `+0` to reach a screen.
//
// **Nought is not a preview.** A squad owed nothing prints nothing, because a
// `+0` reads as a claim that the clean sheets have been counted — and the whole
// content of this mark is that they have not been.
//
// It names no size. The four callers set it from the line they sit in, which is
// how the same fact comes out at 11px beside a squad and at the section's own
// size beside a scoreline.

export default function Pending({
  points,
}: {
  /** Undefined is no table for this side at all, null is a table owing nothing,
   *  and nought is a table that owes nought. All three print nothing, and they
   *  are kept apart upstream where the difference means something. */
  points: number | null | undefined;
}) {
  if (!points) return null;

  // Kept beside the total rather than folded into it. Fantrax's number stays
  // Fantrax's; this is the bit they have not credited yet.
  return <span className="numeric shrink-0 font-semibold text-accent">+{points}</span>;
}
