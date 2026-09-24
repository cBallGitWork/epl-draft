import { INSTINCTS, type Instinct } from "./predictions/pick";

// The tie a columnist files, and the edge that refuses a malformed or repeated one before the page reads it.

/** One tie and the columnist's line on it, filed under a story (`story.ts`). */
export interface EditionTie {
  /** Both team ids, so the page joins to its own names rather than printing the
   *  writer's copy of them — a name typed by a model is a name that goes stale
   *  the day somebody renames their team. */
  homeTeamId: string;
  awayTeamId: string;
  /** The columnist's line about it. */
  line: string;
  /** Who he says wins; null when he would not call it, which is a real answer and not a missing one. */
  callsTeamId?: string | null;
  /** Why he went against the favourite; absent when he backed it. */
  instinct?: Instinct;
  /** The score he predicts, stamped by the desk and never by the writer. */
  score?: { home: number; away: number };
}

/** First wins: a second attempt at the same key is a retry, not a sequel. */
export function once<T>(items: T[], keyOf: (item: T) => string): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = keyOf(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** One tie rebuilt field by field, or nothing. A called tie may have no line: its prose failed the
 *  editor and the call still prints, because next week's marking needs it. */
export function normalizeTie(value: unknown): EditionTie[] {
  const tie = value as Partial<EditionTie> | null;
  if (typeof tie?.homeTeamId !== "string" || typeof tie.awayTeamId !== "string") return [];
  const line = typeof tie.line === "string" ? tie.line : "";
  const callsTeamId =
    tie.callsTeamId === null || (typeof tie.callsTeamId === "string" && tie.callsTeamId !== "")
      ? tie.callsTeamId
      : undefined;
  if (line === "" && typeof callsTeamId !== "string") return [];
  const score = tie.score;
  return [
    {
      homeTeamId: tie.homeTeamId,
      awayTeamId: tie.awayTeamId,
      line,
      ...(callsTeamId === undefined ? {} : { callsTeamId }),
      ...(INSTINCTS.includes(tie.instinct as Instinct) ? { instinct: tie.instinct } : {}),
      ...(Number.isFinite(score?.home) && Number.isFinite(score?.away)
        ? { score: { home: score?.home as number, away: score?.away as number } }
        : {}),
    },
  ];
}
