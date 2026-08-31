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

/** This period's ties and their totals, from the cache the head-to-head board
 *  already fills — so on a Saturday this is a hit rather than a request.
 *
 *  `getLiveScoringStats` and not the season results table, for two reasons that
 *  both matter: it honours the period, and it carries `toPlay`, which is how the
 *  paper knows a match is over rather than merely quiet. */
export async function readBoard(drafted: ReadableSquads): Promise<Board | null> {
  const period = drafted.roundPeriod;
  if (period === null || drafted.info === null) return null;

  const { scores } = await liveScores(period);
  return { pairings: periodPairings(drafted.info.matchups, drafted.info.teams, period), scores };
}
