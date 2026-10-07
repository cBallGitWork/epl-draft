import { type LiveTeamScore, type PeriodPairing, periodPairings } from "@epl/core";
import { liveScores } from "./scoreboard";
import type { ReadableSquads } from "./squads";

// The round's head-to-head board, as the paper reads it.

/** The period's ties with Fantrax's own totals against them. */
export interface Board {
  pairings: PeriodPairing[];
  /** A Map rather than entries: nothing here crosses a cache boundary — the
   *  reads inside it are cached, the assembled edition is not. */
  scores: Map<string, LiveTeamScore>;
}

/** This period's ties and totals, off the head-to-head board's cache. Live scoring, not the results
 *  table: it honours the period, and its `toPlay` says a match is over. */
export async function readBoard(drafted: ReadableSquads): Promise<Board | null> {
  const period = drafted.roundPeriod;
  if (period === null || drafted.info === null) return null;

  const { scores } = await liveScores(period);
  return { pairings: periodPairings(drafted.info.matchups, drafted.info.teams, period), scores };
}
