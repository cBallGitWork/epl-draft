import {
  type Fixture,
  type LeagueInfo,
  datedKickoffs,
  firstKickoff,
  gameweekStarted,
  gameweekStatus,
  periodGameweeks,
  periodLock,
} from "@epl/core";
import type { ScheduleRound } from "./schedule";

/** The league's rounds, ascending: one per period, for the gameweek it is for (`own`), so a period's ties are listed
 *  once and a rearranged match never moves its gameweek; a break, which holds none, is not on it. */
export function scheduleRounds(info: LeagueInfo, season: readonly Fixture[]): ScheduleRound[] {
  const kickoffs = datedKickoffs(season);

  // When each round's lineups lock: off the roster period's first kickoff, never its boundary (`gazette/deadline.ts`).
  const opens = new Map(
    info.rosterPeriods.map((period) => [period.number, { kickoff: firstKickoff(period, kickoffs), deadline: periodLock(period, kickoffs) }]),
  );

  return periodGameweeks(info.scoringPeriods, kickoffs)
    .flatMap(({ period, own }) =>
      own === null
        ? []
        : [{
            gameweek: own,
            period,
            deadline: opens.get(period)?.deadline ?? null,
            kickoff: opens.get(period)?.kickoff ?? null,
            status: gameweekStatus(season, own),
            started: gameweekStarted(season, own),
          }],
    )
    .sort((a, b) => a.gameweek - b.gameweek);
}
