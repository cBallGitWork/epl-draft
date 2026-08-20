import type { CompetitionTie, LeagueTeam, PeriodResult } from "@epl/core";
import type { ScheduleRound } from "./schedule";

// One team's season, assembled: every round it is in, told from that team's
// side.
//
// Fantrax reports a home and an away because that is what the schedule says, and
// every screen that shows a head-to-head from one team's point of view
// immediately undoes it — there is no ground, so neither side is at home, and
// the team you asked about reads first. `headToHead` does this for one period
// over pairings; this does it for a whole season over ties, which carry the
// knockouts too.

export interface SeasonRow {
  round: ScheduleRound;
  tie: CompetitionTie;
  /** The asked-about team's total, then its opponent's. Null is "we have no
   *  number", never nought — and a round still to come has no number at all. */
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
  // Keyed by period and not by gameweek: `PeriodResult` is Fantrax's own
  // numbering and the round carries the mapping. They agree all season, and
  // joining on the one they published is what survives the season they do not.
  const scored = new Map(results.map((row) => [`${row.period}:${row.teamId}`, row.points]));

  return rounds.flatMap((round) =>
    tiesIn(round)
      .filter((tie) => tie.home.team?.teamId === teamId || tie.away.team?.teamId === teamId)
      .map((tie) => {
        const home = tie.home.team?.teamId === teamId;
        const theirs = home ? tie.home : tie.away;
        const them = home ? tie.away : tie.home;

        // A round still to come has no score to report. Fantrax answers 0 for
        // every unplayed period and reporting it would print a goalless draw
        // against a date in March.
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
