import type { PeriodResult } from "./fantrax/results";

// What a team's season looks like as a distribution rather than as a total.
// Pure.
//
// **The table already says who is winning; this says how.** Two sides on the
// same points-for got there differently — one at 60 every week, one alternating
// 90 and 30 — and a league table cannot tell them apart because a total is the
// one number that throws that away. High, low and average are the cheapest three
// figures that put it back, and all three come off `getSeasonResults`, which is
// already cached for the table's form guide. Team Stats costs no provider read.
//
// **Which periods count is the caller's, and it is not "all of them".** Fantrax
// answers for every period asked, including thirty-odd nobody has played, and
// averaging those in would put every side on a fraction of their real form.
// Passing the set in rather than filtering here also keeps the clock out: which
// rounds have finished is a question about football, and this file is arithmetic.

export interface TeamPeriodStats {
  teamId: string;
  /** Rounds with a readable total. Not the league's `played` — a round Fantrax
   *  scored as blank is a round this cannot describe, and counting it would
   *  divide by a game nobody has a number for. */
  scored: number;
  /** Null when the team has no readable total at all, which is every team until
   *  a round is scored. Absence, never a nought: a side that has not played has
   *  not scored nought. */
  high: number | null;
  low: number | null;
  /** The mean, unrounded. Rounding is a rendering decision and the view makes
   *  it — `59.5` and `60` are the same fact told at two precisions, and only one
   *  of them survives being averaged again. */
  average: number | null;
}

export function teamPeriodStats(
  results: readonly PeriodResult[],
  periods: ReadonlySet<number>,
): TeamPeriodStats[] {
  const totals = new Map<string, number[]>();

  for (const result of results) {
    if (!periods.has(result.period) || result.points === null) continue;
    const seen = totals.get(result.teamId) ?? [];
    seen.push(result.points);
    totals.set(result.teamId, seen);
  }

  return [...totals].map(([teamId, points]) => ({
    teamId,
    scored: points.length,
    high: Math.max(...points),
    low: Math.min(...points),
    average: points.reduce((sum, one) => sum + one, 0) / points.length,
  }));
}
