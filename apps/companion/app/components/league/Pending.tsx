// Points Fantrax has not credited yet: a clean sheet, credited only at the final whistle (`pendingCleanSheets`).
// Nought prints nothing, as a `+0` would claim the clean sheets were counted; the caller sets the size.

export default function Pending({
  points,
}: {
  /** Undefined (no table), null (owing nothing) and nought all print nothing. */
  points: number | null | undefined;
}) {
  if (!points) return null;

  // Beside Fantrax's total, never folded into it; amber as a lone figure, not the accent (DESIGN §8).
  return <span className="numeric shrink-0 font-semibold text-mid">+{points}</span>;
}
