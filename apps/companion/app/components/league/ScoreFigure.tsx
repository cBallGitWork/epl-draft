import { trails } from "@epl/core";

// One side's total, read by the scoreline rule.
//
// Two things and only two: **a dash for a total Fantrax did not give, never a
// nought**, and **the trailing side dims**. Both are stated once here because
// they had been written out four times — the head-to-head card, the desk's wall
// rows, your own matchup summary, and now the front page's splash — and
// `docs/ui/desk.md` recorded that the third occurrence is what earns the
// extraction. This is the fourth.
//
// Only the NUMBER dims. A name that dimmed for losing would give the accent a
// second meaning, and accent means "you" and nothing else.
//
// Everything else stays the caller's, because the four genuinely diverge and an
// options bag reconciling them would be the abstraction CODE_RULES §1 forbids: a
// card is a 44px tap target at `text-xl`, your own summary is `text-3xl`, a desk
// row is untappable by documented constraint and carries no size of its own. So
// the size, the family and the width come in as a class.

export default function ScoreFigure({
  points,
  /** The other side's, for the comparison — and never for display. `trails`
   *  answers false whenever either is missing, so a number beside a dash beats
   *  nothing and neither of them dims. */
  other,
  className = "",
}: {
  points: number | null;
  other: number | null;
  className?: string;
}) {
  return (
    <span className={`${trails(points, other) ? "text-muted" : "text-ink"} ${className}`}>
      {points ?? "—"}
    </span>
  );
}
