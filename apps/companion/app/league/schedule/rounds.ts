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

/** The league's rounds, ascending: Fantrax's periods as gameweeks (`periodGameweeks`, the one-way seam). */
export function scheduleRounds(info: LeagueInfo, season: readonly Fixture[]): ScheduleRound[] {
  const kickoffs = datedKickoffs(season);

  // When each round's lineups lock: off the roster period's first kickoff, never its boundary (`gazette/deadline.ts`).
  const opens = new Map(
    info.rosterPeriods.map((period) => [period.number, { kickoff: firstKickoff(period, kickoffs), deadline: periodLock(period, kickoffs) }]),
  );

  return periodGameweeks(info.scoringPeriods, kickoffs)
    // A double holds two gameweeks and a break none; flattened, the page is a list of gameweeks.
    .flatMap((period) =>
      period.gameweeks.map((gameweek) => ({
        gameweek,
        period: period.period,
        deadline: opens.get(period.period)?.deadline ?? null,
        kickoff: opens.get(period.period)?.kickoff ?? null,
        status: gameweekStatus(season, gameweek),
        started: gameweekStarted(season, gameweek),
      })),
    )
    .sort((a, b) => a.gameweek - b.gameweek)
    // One round per gameweek: a postponed fixture puts its gameweek in two periods, and the lower is its own week.
    .filter((round, at, all) => all.findIndex((e) => e.gameweek === round.gameweek) === at);
}
