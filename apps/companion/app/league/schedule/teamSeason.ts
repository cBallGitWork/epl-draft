import type { CompetitionTie, LeagueTeam, PeriodResult } from "@epl/core";
import type { ScheduleRound } from "./schedule";

// One team's season over ties, knockouts included, told from its side: there is no ground, so the team asked about reads first.

export interface SeasonRow {
  round: ScheduleRound;
  tie: CompetitionTie;
  /** The asked-about team's total, then its opponent's; null is no number, never nought. */
  pointsFor: number | null;
  pointsAgainst: number | null;
  opponent: { team: LeagueTeam | null; label: string };
}

export function seasonRows(
  rounds: readonly ScheduleRound[],
  /** The ties in one round, already filtered to the competition on screen. */
  tiesIn: (round: ScheduleRound) => CompetitionTie[],
  results: readonly PeriodResult[],
  teamId: string,
): SeasonRow[] {
  // Keyed by Fantrax's period, which the round carries, not by gameweek.
  const scored = new Map(results.map((row) => [`${row.period}:${row.teamId}`, row.points]));

  return rounds.flatMap((round) =>
    tiesIn(round)
      .filter((tie) => tie.home.team?.teamId === teamId || tie.away.team?.teamId === teamId)
      .map((tie) => {
        const home = tie.home.team?.teamId === teamId;
        const theirs = home ? tie.home : tie.away;
        const them = home ? tie.away : tie.home;

        // A round to come has no score: Fantrax answers 0 for every unplayed period.
        const at = (side: string | undefined) =>
          side === undefined || !round.started
            ? null
            : scored.get(`${round.period}:${side}`) ?? null;

        return {
          round,
          tie,
          pointsFor: at(theirs.team?.teamId),
          pointsAgainst: at(them.team?.teamId),
          opponent: { team: them.team, label: them.label },
        };
      }),
  );
}
