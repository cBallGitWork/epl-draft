import { trails, DASH } from "@epl/core";

// One side's total by the scoreline rule: a dash, never a nought, for a total Fantrax did not give,
// and the trailing side's number dims, never its name. Size, family and width are the caller's class.

export default function ScoreFigure({
  points,
  /** The other side's, for the comparison only; with either missing, `trails` is false and neither dims. */
  other,
  className = "",
}: {
  points: number | null;
  other: number | null;
  className?: string;
}) {
  return (
    <span className={`${trails(points, other) ? "text-muted" : "text-ink"} ${className}`}>
      {points ?? DASH}
    </span>
  );
}
