import type { PeriodResult } from "./fantrax/results";
import type { LeagueMatchup, StandingsRow } from "./types";

// A team's recent results, W-D-L, in the order they happened. Pure.
//
// The one thing a league table cannot say. The record column is a total — a side
// on 5-2-3 might have won five and then lost three, or lost three and then won
// five, and those are not the same team. Fantrax publishes the totals and one
// `streak` string, and nothing that reads across the season.
//
// It costs no new request. `mapSeasonResults` answers all 38 rounds in one call,
// and this joins them to the pairings `getLeagueInfo` already carries.
//
// **Two rules keep it honest, and they exist because Fantrax's results table
// lies about the future.** An unplayed round reads `0` on it, not blank — probed
// 29 Aug 2026, where every gameweek from 3 to 38 answered 0-0 for every pairing.
// So "there is a number" is not "it has been played", and a run built on that
// would give every side thirty-six goalless draws in March.
//
//  1. **How many games count is Fantrax's answer, not ours.** `won + drawn +
//     lost` is what THEY have settled, so the run stops there. A round in play
//     falls outside it on its own: on 29 Aug the rehearsal league was mid-round
//     with one game counted, and gameweek 2's live totals are correctly not in
//     anybody's form.
//  2. **The run has to agree with their record, or there is no run.** Tally the
//     letters; if the wins, draws and losses do not match the row Fantrax
//     published, we have lined the season up wrongly — a void round, a
//     rearrangement, a pairing that never happened — and the honest answer is a
//     dash rather than five letters that are nearly right.
//
// Nothing here computes a rank or a points total. What a win is worth is a
// commissioner setting (§3) and last week's table cannot be rebuilt without it,
// which is why this file carries form and no movement arrow.

export type FormResult = "W" | "D" | "L";

/** One settled round, from one team's side. */
export interface FormGame {
  /** Fantrax's period, so a glyph can say which round it was. */
  period: number;
  result: FormResult;
  /** The two fantasy totals that decided it, theirs and the opponent's. */
  pointsFor: number;
  pointsAgainst: number;
}

export interface TeamForm {
  teamId: string;
  /** Oldest first, and empty for a side we cannot vouch for — a league that has
   *  played nothing, a results read that did not answer, or a run that
   *  disagreed with Fantrax's own record. All three are a dash. */
  run: FormGame[];
}

export function seasonForm(
  table: readonly StandingsRow[],
  matchups: readonly LeagueMatchup[],
  results: readonly PeriodResult[],
): TeamForm[] {
  const scored = new Map(results.map((row) => [scoreKey(row.period, row.teamId), row.points]));
  // Ascending, because a run is an order and `matchups` arrives in whatever
  // order Fantrax listed the periods in.
  const fixtures = [...matchups].sort((a, b) => a.period - b.period);

  return table.map((row) => ({ teamId: row.teamId, run: runOf(row, fixtures, scored) }));
}

function runOf(
  row: StandingsRow,
  fixtures: readonly LeagueMatchup[],
  scored: ReadonlyMap<string, number | null>,
): FormGame[] {
  const settled = row.won + row.drawn + row.lost;
  if (settled === 0) return [];

  const run: FormGame[] = [];
  for (const fixture of fixtures) {
    if (run.length === settled) break;

    const opponent = opponentIn(fixture, row.teamId);
    if (opponent === null) continue;

    const scoredFor = scored.get(scoreKey(fixture.period, row.teamId));
    const scoredAgainst = scored.get(scoreKey(fixture.period, opponent));
    // A round one side has no number for cannot be called for either of them.
    if (typeof scoredFor !== "number" || typeof scoredAgainst !== "number") continue;

    run.push({
      period: fixture.period,
      pointsFor: scoredFor,
      pointsAgainst: scoredAgainst,
      result: scoredFor > scoredAgainst ? "W" : scoredFor < scoredAgainst ? "L" : "D",
    });
  }

  return agreesWith(run, row) ? run : [];
}

/** Whether our reading of the season is the one Fantrax settled. */
function agreesWith(run: readonly FormGame[], row: StandingsRow): boolean {
  const count = (result: FormResult) => run.filter((game) => game.result === result).length;
  return count("W") === row.won && count("D") === row.drawn && count("L") === row.lost;
}

/** Who this team played in this round, or null when it is not in it. */
function opponentIn(fixture: LeagueMatchup, teamId: string): string | null {
  if (fixture.homeTeamId === teamId) return fixture.awayTeamId;
  if (fixture.awayTeamId === teamId) return fixture.homeTeamId;
  return null;
}

function scoreKey(period: number, teamId: string): string {
  return `${period}:${teamId}`;
}
