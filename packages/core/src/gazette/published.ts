// The tie a columnist files, called in a preview or reported in a line, and the edge that refuses
// a malformed or repeated one before the page reads it.

/** One tie, called or reported in a line. Shared with `story.ts`, whose ties
 *  are the same object filed under a rolling story. */
export interface EditionTie {
  /** Both team ids, so the page joins to its own names rather than printing the
   *  writer's copy of them — a name typed by a model is a name that goes stale
   *  the day somebody renames their team. */
  homeTeamId: string;
  awayTeamId: string;
  /** The columnist's line about it. */
  line: string;
  /** For a preview only: who he says wins. Null when he would not call it, which
   *  is a real answer and not a missing one. Never set on a report. */
  callsTeamId?: string | null;
}

/** First wins — a second attempt at the same key is a retry, not a sequel.
 *  Exported for `story.ts`, which refuses repeats at the same edge. */
export function once<T>(items: T[], keyOf: (item: T) => string): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = keyOf(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function isTie(value: unknown): value is EditionTie {
  const tie = value as Partial<EditionTie>;
  return (
    typeof tie?.homeTeamId === "string" &&
    typeof tie.awayTeamId === "string" &&
    typeof tie.line === "string" &&
    tie.line !== ""
  );
}
