import type { PeriodResult } from "./fantrax/results";
import type { LeagueMatchup, StandingsRow } from "./types";

// A team's results, W-D-L, oldest first. Pure. Fantrax's results read an unplayed gameweek as 0-0, so the run stops
// at the games Fantrax's record has settled and must agree with that record, or there is no run.
// Computes no rank or points total: what a win is worth is a commissioner setting.

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
  /** Oldest first; empty (a dash) for nothing played, no results read, or a run that disagrees with Fantrax's record. */
  run: FormGame[];
}

export function seasonForm(
  table: readonly StandingsRow[],
  matchups: readonly LeagueMatchup[],
  results: readonly PeriodResult[],
): TeamForm[] {
  const scored = new Map(results.map((row) => [scoreKey(row.period, row.teamId), row.points]));
  // Ascending: `matchups` arrives in whatever order Fantrax listed the periods.
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
