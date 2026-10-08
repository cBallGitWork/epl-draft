import { rounded } from "../format";
import type { StandingsRow } from "../league/types";
import type { StoryResult } from "./types";

// The facts a power ranking is argued from; the argument, never the table's order, is the column's.

export interface PowerRow {
  teamId: string;
  name: string;
  /** Where the table has them. */
  rank: number;
  record: string;
  points: number;
  /** Fantasy points for, Fantrax's own FPtsF: whether the table flatters them. */
  scored: number;
  /** This gameweek's result as a phrase, "beat test4 by 26"; null until their tie is decided. */
  round: string | null;
}

export function powerRows(
  table: readonly StandingsRow[],
  results: readonly StoryResult[],
): PowerRow[] {
  return table.map((row) => ({
    teamId: row.teamId,
    name: row.teamName,
    rank: row.rank,
    record: `${row.won}-${row.drawn}-${row.lost}`,
    points: row.points,
    scored: row.pointsFor,
    round: roundLine(row.teamId, results),
  }));
}

function roundLine(teamId: string, results: readonly StoryResult[]): string | null {
  const result = results.find(
    (played) => played.winner.teamId === teamId || played.loser.teamId === teamId,
  );
  if (result === undefined) return null;
  return result.winner.teamId === teamId
    ? `beat ${result.loser.name} by ${round(result.margin)}`
    : `lost to ${result.winner.name} by ${round(result.margin)}`;
}

/** A margin to one decimal place. */
function round(margin: number): string {
  return String(rounded(margin, 1));
}
