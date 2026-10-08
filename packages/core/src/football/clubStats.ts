import { NO_SEASON } from "./noSeason";
import { byKickoffUndatedFirst } from "./selectors";
import type { Club, Fixture, FootballPlayer, SeasonTotals } from "./types";

// A club's season beyond its table row: home and away records, its run, clean sheets and its squad's totals.
// Only finished fixtures count, as in `table.ts`: a side leading at half time has not kept a clean sheet.

/** The six figures a table row carries, for a subset of fixtures; not `Record`, which would shadow TypeScript's. */
export interface ClubRecord {
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
}

export type Result = "W" | "D" | "L";

export interface ClubStats {
  clubId: number;
  home: ClubRecord;
  away: ClubRecord;
  /** Every result this season, oldest first; how many to show is the drawer's call. */
  form: Result[];
  /** Finished matches in which the club conceded nothing, and in which it scored nothing. */
  cleanSheets: number;
  failedToScore: number;
  /** The season totals of every man FPL files at this club, whether or not he has played. */
  squad: SeasonTotals;
}

/** Every club's season, in the order the clubs arrive; ordering is the caller's. */
export function clubStats(
  fixtures: readonly Fixture[],
  clubs: readonly Club[],
  players: readonly FootballPlayer[],
): ClubStats[] {
  const rows = new Map<number, ClubStats>(
    clubs.map((club) => [
      club.id,
      {
        clubId: club.id,
        home: blank(),
        away: blank(),
        form: [],
        cleanSheets: 0,
        failedToScore: 0,
        squad: { ...NO_SEASON },
      },
    ]),
  );

  // Chronological, so the form guide runs in the order the season did; an undated fixture cannot be finished.
  const played = [...fixtures]
    .filter((fixture) => fixture.status === "finished")
    .filter((fixture) => fixture.homeScore !== null && fixture.awayScore !== null)
    .sort(byKickoffUndatedFirst);

  for (const fixture of played) {
    const home = rows.get(fixture.homeClubId);
    const away = rows.get(fixture.awayClubId);
    // A fixture naming a club this snapshot does not carry counts for neither side, as in `table.ts`.
    if (home === undefined || away === undefined) continue;
    // Narrowed above; repeated here because the filter cannot tell the compiler.
    if (fixture.homeScore === null || fixture.awayScore === null) continue;

    side(home, home.home, fixture.homeScore, fixture.awayScore);
    side(away, away.away, fixture.awayScore, fixture.homeScore);
  }

  for (const player of players) {
    const row = rows.get(player.clubId);
    if (row === undefined) continue;
    add(row.squad, player.season);
  }

  return [...rows.values()];
}

function blank(): ClubRecord {
  return { played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0 };
}

/** One club's half of one match, written into the right half of its record and onto the end of its run. */
function side(row: ClubStats, half: ClubRecord, scored: number, conceded: number): void {
  half.played += 1;
  half.goalsFor += scored;
  half.goalsAgainst += conceded;
  if (conceded === 0) row.cleanSheets += 1;
  if (scored === 0) row.failedToScore += 1;

  if (scored > conceded) {
    half.won += 1;
    row.form.push("W");
  } else if (scored === conceded) {
    half.drawn += 1;
    row.form.push("D");
  } else {
    half.lost += 1;
    row.form.push("L");
  }
}

/** Adds one man's season onto his club's, over every key of the blank so a new total is counted without an edit here. */
function add(into: SeasonTotals, from: SeasonTotals): void {
  for (const key of Object.keys(NO_SEASON) as (keyof SeasonTotals)[]) {
    into[key] += from[key];
  }
}
