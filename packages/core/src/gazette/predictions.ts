import type { TeamProjection } from "../league/points";
import type { PeriodPairing } from "../league/selectors";
import type { EditionTie } from "./published";
import type { StoryResult } from "./types";

// The predictions column, and the marking of it.
//
// **A pundit nobody marks is a pundit who never has to be right**, which is
// the whole reason this column is worth printing: the calls are filed, the
// results come in, and the next one opens by owning the score.
//
// The projections are the FIRST consumer of `mapProjectedTotals`. Two rules
// travel with them, both probed: read `projectedTotalsMap` and never
// `calculatedProjectedTotalsMap` — the second improves itself once the
// football starts, which is marking your own homework — and never read
// `totalFpts` before a round, where it is a truthful nought for everybody and
// would hand the writer nought against nought for every tie.

/** One tie as the column is asked to call it. */
export interface PredictionTie {
  homeTeamId: string;
  homeName: string;
  awayTeamId: string;
  awayName: string;
  /** Fantrax's own pre-round projection, or null where they gave none. Null is
   *  not nought: "no guess" and "we think nobody scores" are different claims,
   *  and only the first is honest about a projection Fantrax withheld. */
  homeProjected: number | null;
  awayProjected: number | null;
}

export function predictionTies(
  pairings: readonly PeriodPairing[],
  projected: Map<string, TeamProjection>,
): PredictionTie[] {
  return pairings.map((pairing) => ({
    homeTeamId: pairing.home.teamId,
    homeName: pairing.home.name,
    awayTeamId: pairing.away.teamId,
    awayName: pairing.away.name,
    homeProjected: projected.get(pairing.home.teamId)?.points ?? null,
    awayProjected: projected.get(pairing.away.teamId)?.points ?? null,
  }));
}

/** How the last column's calls turned out.
 *
 *  Pure comparison, no writer involved — so the score is a fact about the
 *  football rather than a claim the column makes about itself.
 *
 *  Only ties he actually called are counted. Declining to call one is not a
 *  wrong answer, and folding it in as one would make silence the cheapest way
 *  to look right. A tie that produced no result marks nothing: a match still
 *  being played is not a call he got wrong. */
export interface Marked {
  right: number;
  called: number;
}

export function markCalls(
  ties: readonly EditionTie[] | undefined,
  results: readonly StoryResult[],
): Marked | null {
  if (ties === undefined) return null;

  let right = 0;
  let called = 0;
  for (const tie of ties) {
    const call = tie.callsTeamId;
    if (typeof call !== "string" || call === "") continue;

    const result = results.find(
      (played) =>
        (played.winner.teamId === tie.homeTeamId && played.loser.teamId === tie.awayTeamId) ||
        (played.winner.teamId === tie.awayTeamId && played.loser.teamId === tie.homeTeamId),
    );
    if (result === undefined) continue;

    called += 1;
    if (result.winner.teamId === call) right += 1;
  }

  return called === 0 ? null : { right, called };
}
