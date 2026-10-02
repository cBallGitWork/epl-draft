/** Why a breakdown has no rows: a total with no parts, or nothing yet, or nothing at all once his match is over. */
export function emptyBreakdownNote(points: number | null, minutes: number, over: boolean): string {
  if (points) return "Fantrax scored him, but did not say what for.";
  if (over) return minutes > 0 ? "Nothing scored for him." : "Did not play.";
  return minutes > 0
    ? "Nothing has scored for him yet."
    : "Nothing has scored for him yet — his minutes have not registered either.";
}
