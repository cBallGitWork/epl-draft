import type { StandingsRow } from "../league/types";
import type { StoryResult } from "./types";

// The facts a power ranking is argued from. The ARGUMENT is the column's — it
// is an opinion piece and expressly not the table — but the facts under it are
// ours, so the model ranks sixteen sides it has actually been told about.
//
// **It is never the table and must never read like one.** The table is
// Fantrax's arithmetic and prints on the same page; a second ordering claiming
// the same authority would be the paper disagreeing with itself. This one is
// allowed to say a side is flattered by its record, which is the only reason
// anybody reads a power ranking.

export interface PowerRow {
  teamId: string;
  name: string;
  /** Where the actual table has them — the thing the column is arguing with. */
  rank: number;
  record: string;
  points: number;
  /** Fantasy points for, Fantrax's own FPtsF: the "are they flattered by the
   *  table" number, and the reason this column can disagree with it. */
  scored: number;
  /** This round's result for them, in a phrase: "beat test4 by 26", "lost to
   *  test2 by 3". Null when their tie has not been decided. */
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

/** Margins arrive with Fantrax's decimals; a column does not need them. */
function round(margin: number): string {
  return String(Math.round(margin * 10) / 10);
}
