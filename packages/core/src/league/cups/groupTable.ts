import { leads, trails } from "../scoreline";
import type { GroupStage } from "./declared";

/** One group fixture and what each side scored in its gameweek; null until Fantrax has scored it. */
export interface CupResult {
  home: string;
  away: string;
  homePoints: number | null;
  awayPoints: number | null;
}

interface GroupRow {
  teamId: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  points: number;
  pointsFor: number;
  pointsAgainst: number;
}

/** A group placed by points, then fantasy points for, then draw order (the league's own order, bar names). */
export function groupTable(
  teamIds: readonly string[],
  results: readonly CupResult[],
  points: GroupStage["points"],
): GroupRow[] {
  const rows = new Map(teamIds.map((teamId) => [teamId, emptyRow(teamId)]));

  for (const result of results) {
    const home = rows.get(result.home);
    const away = rows.get(result.away);
    if (!home || !away || result.homePoints === null || result.awayPoints === null) continue;
    record(home, result.homePoints, result.awayPoints, points);
    record(away, result.awayPoints, result.homePoints, points);
  }

  return [...rows.values()].sort(
    (a, b) =>
      b.points - a.points ||
      b.pointsFor - a.pointsFor ||
      teamIds.indexOf(a.teamId) - teamIds.indexOf(b.teamId),
  );
}

/** The knockout's seeds in order: every group winner, then every runner-up, and so on down to the cut. */
export function groupQualifiers<T>(tables: readonly (readonly T[])[], qualify: number): T[] {
  const seeds: T[] = [];
  for (let place = 0; place < qualify; place++) {
    for (const table of tables) {
      const row = table[place];
      if (row !== undefined) seeds.push(row);
    }
  }
  return seeds;
}

function emptyRow(teamId: string): GroupRow {
  return { teamId, played: 0, won: 0, drawn: 0, lost: 0, points: 0, pointsFor: 0, pointsAgainst: 0 };
}

function record(row: GroupRow, scored: number, conceded: number, points: GroupStage["points"]): void {
  row.played += 1;
  row.pointsFor += scored;
  row.pointsAgainst += conceded;
  if (leads(scored, conceded)) {
    row.won += 1;
    row.points += points.won;
  } else if (trails(scored, conceded)) {
    row.lost += 1;
  } else {
    row.drawn += 1;
    row.points += points.drawn;
  }
}
