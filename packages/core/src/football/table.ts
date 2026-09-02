import type { Club, Fixture } from "./types";

// The Premier League table, computed from finished fixtures.
//
// **Computed, and it has to be.** FPL's bootstrap carries `played`, `win`,
// `draw`, `loss` and `points` on every club and every one of them is nought on
// all twenty with two gameweeks finished and signed off (re-counted 2 Sep 2026)
// — the same shape of dead field as `squad_number`. A field that is always
// nought is not a field, so the table is built from results rather than read.
//
// `position` is the exception and is still not a way out: it is non-zero and
// distinct on all twenty, but it sits beside a `played` of nought on every club,
// so whatever it is ordering it is not a record anybody has played. This file
// used to say it was nought too, which was wrong about the field and right about
// the conclusion.
//
// This belongs in the FOOTBALL layer precisely because its rules are fixed for
// everyone: three for a win, goal difference, then goals scored, is the
// Premier League's own arrangement and not a setting anybody can change. That
// is the layer split's whole test — a league layer may hold no such constant,
// and this one may.

/** Three for a win, one for a draw. A rule of the competition, not of ours. */
const WIN = 3;
const DRAW = 1;

export interface TableRow {
  clubId: number;
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

/** The table as it stands after every finished fixture. Provisional by nature
 *  while a round is being played, which is what a league table is. */
export function leagueTable(fixtures: readonly Fixture[], clubs: readonly Club[]): TableRow[] {
  const rows = new Map<number, TableRow>(
    clubs.map((club) => [
      club.id,
      {
        clubId: club.id,
        name: club.name,
        shortName: club.shortName,
        played: 0, won: 0, drawn: 0, lost: 0,
        goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0,
      },
    ]),
  );

  for (const fixture of fixtures) {
    // A score is only a result once the match is over: FPL writes running
    // scores onto a fixture in play, and a table that counted those would move
    // a club up the order for being ahead at half time.
    if (fixture.status !== "finished") continue;
    if (fixture.homeScore === null || fixture.awayScore === null) continue;
    const home = rows.get(fixture.homeClubId);
    const away = rows.get(fixture.awayClubId);
    // A fixture naming a club this snapshot does not carry is not half a
    // result: it counts for neither side rather than for one.
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
