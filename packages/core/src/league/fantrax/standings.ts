import type { StandingsRow } from "../types";
import type { RawStandings } from "./raw";

// `getStandings` → the league table. Pure.
//
// Every value in every sample we hold is zero, because no gameweek has been
// played in either league. That is why `record` stays the raw "0-0-0" string and
// why `gamesBack` and `winPercentage` — both derived, both derivable — are not
// mapped at all.

export function mapStandings(raw: RawStandings): StandingsRow[] {
  const rows: StandingsRow[] = [];
  for (const row of raw) {
    // A row that names no team cannot be shown against anything.
    if (!row.teamId) continue;
    rows.push({
      teamId: row.teamId,
      teamName: row.teamName ?? "",
      rank: row.rank ?? 0,
      record: row.points ?? "",
      pointsFor: row.totalPointsFor ?? 0,
    });
  }
  return rows.sort((a, b) => a.rank - b.rank);
}
