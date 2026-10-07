import type { Club, Fixture } from "./types";

// The Premier League table, computed from finished fixtures: bootstrap's `played`, `win`, `draw`, `loss` and `points`
// are nought on every club, and its `position` orders no record anybody has played.

/** Three for a win, one for a draw. A rule of the competition, not of ours. */
const WIN = 3;
const DRAW = 1;

export interface TableRow {
  clubId: number;
  /** FPL's season-stable club code, which keys the crest; `clubId` is per-season and never reaches a URL or disk. */
  code: number;
  name: string;
  shortName: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

/** The table after every finished fixture: points, goal difference, goals scored, then name. */
export function leagueTable(fixtures: readonly Fixture[], clubs: readonly Club[]): TableRow[] {
  const rows = new Map<number, TableRow>(
    clubs.map((club) => [
      club.id,
      {
        clubId: club.id,
        code: club.code,
        name: club.name,
        shortName: club.shortName,
        played: 0, won: 0, drawn: 0, lost: 0,
        goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0,
      },
    ]),
  );

  for (const fixture of fixtures) {
    // A score is a result only once the match is over: FPL writes running scores onto a match in play.
    if (fixture.status !== "finished") continue;
    if (fixture.homeScore === null || fixture.awayScore === null) continue;
    const home = rows.get(fixture.homeClubId);
    const away = rows.get(fixture.awayClubId);
    // A fixture naming a club this snapshot does not carry counts for neither side.
    if (home === undefined || away === undefined) continue;

    score(home, fixture.homeScore, fixture.awayScore);
    score(away, fixture.awayScore, fixture.homeScore);
  }

  return [...rows.values()].sort(
    (a, b) =>
      b.points - a.points ||
      b.goalDifference - a.goalDifference ||
      b.goalsFor - a.goalsFor ||
      a.name.localeCompare(b.name),
  );
}

function score(row: TableRow, scored: number, conceded: number): void {
  row.played += 1;
  row.goalsFor += scored;
  row.goalsAgainst += conceded;
  row.goalDifference = row.goalsFor - row.goalsAgainst;
  if (scored > conceded) {
    row.won += 1;
    row.points += WIN;
  } else if (scored === conceded) {
    row.drawn += 1;
    row.points += DRAW;
  } else {
    row.lost += 1;
  }
}
